#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const FIXTURE_PATH = "fixtures/reverse-agent/memory-store.fixture.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

function eventHash(event) {
  const { entryHash, ...withoutHash } = event;
  return sha256(JSON.stringify(withoutHash));
}

function sealEvents(seedEvents) {
  let prevHash = "0".repeat(64);
  return (seedEvents ?? []).map((seed, index) => {
    const event = { ...seed, seq: index + 1, prevHash, entryHash: "" };
    event.entryHash = eventHash(event);
    prevHash = event.entryHash;
    return event;
  });
}

function validateEvents(events) {
  const errors = [];
  let prevHash = "0".repeat(64);
  for (const [index, event] of events.entries()) {
    if (event.seq !== index + 1) errors.push(`events[${index}].seq`);
    if (event.prevHash !== prevHash) errors.push(`events[${index}].prevHash`);
    if (event.entryHash !== eventHash(event)) errors.push(`events[${index}].entryHash`);
    prevHash = event.entryHash;
  }
  return errors;
}

function rebuildCaseRows(events) {
  const latest = new Map();
  const rows = [];
  for (const event of events) {
    const previous = latest.get(event.caseSignature);
    const row = {
      kind: "repi-case-memory",
      schemaVersion: 1,
      id: `case:${event.caseSignature}:${event.seq}`,
      ts: event.ts,
      caseSignature: event.caseSignature,
      route: event.route,
      target: event.target,
      domainTags: event.domainTags,
      summary: [event.lessons?.[0], event.reuseRules?.[0], event.failurePatterns?.[0], event.task].filter(Boolean).join(" | ").slice(0, 600),
      eventIds: [...new Set([...(previous?.eventIds ?? []), event.id])],
      commands: [...new Set([...(previous?.commands ?? []), ...(event.commands ?? [])])],
      reuseRules: [...new Set([...(previous?.reuseRules ?? []), ...(event.reuseRules ?? [])])],
      failurePatterns: [...new Set([...(previous?.failurePatterns ?? []), ...(event.failurePatterns ?? [])])],
      quality: {
        confidence: Math.max(previous?.quality?.confidence ?? 0, event.quality.confidence),
        replayVerified: Boolean(previous?.quality?.replayVerified || event.quality.replayVerified),
        reuseCount: (previous?.quality?.reuseCount ?? 0) + (event.outcome === "success" ? 1 : 0),
        failureCount: (previous?.quality?.failureCount ?? 0) + (["failure", "blocked"].includes(event.outcome) ? 1 : 0),
        lastUsefulAt: event.ts,
        decay: Math.max(0, (previous?.quality?.decay ?? 0) * 0.9 + (event.outcome === "failure" ? 0.2 : 0))
      },
      sourceEvents: [...new Set([...(previous?.sourceEvents ?? []), event.entryHash])],
      lastEventHash: event.entryHash
    };
    latest.set(event.caseSignature, row);
    rows.push(row);
  }
  return rows;
}

function markerCheck(id, file, markers, forbidden = []) {
  const path = join(root, file);
  const text = existsSync(path) ? readFileSync(path, "utf8") : "";
  const missing = markers.filter((marker) => !text.includes(marker));
  const forbiddenHits = forbidden.filter((pattern) => pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern));
  return { id, status: existsSync(path) && missing.length === 0 && forbiddenHits.length === 0 ? "pass" : "fail", evidence: { file, missing, forbiddenHits: forbiddenHits.map(String) } };
}

function run() {
  const checks = [];
  let fixture;
  try {
    fixture = readJson(FIXTURE_PATH);
    const sealed = sealEvents(fixture.events);
    const errors = validateEvents(sealed);
    const broken = structuredClone(sealed);
    broken[1].prevHash = "bad";
    const brokenErrors = validateEvents(broken);
    const rows = rebuildCaseRows(sealed);
    checks.push({ id: "fixture:parse", status: fixture.kind === "repi-memory-store-fixture" ? "pass" : "fail", evidence: { path: FIXTURE_PATH } });
    checks.push({ id: "fixture:hash-chain-pass", status: errors.length === 0 ? "pass" : "fail", evidence: { errors } });
    checks.push({ id: "fixture:hash-chain-negative", status: brokenErrors.includes("events[1].prevHash") ? "pass" : "fail", evidence: { errors: brokenErrors } });
    checks.push({ id: "fixture:repair-index-rebuild", status: rows.length === sealed.length && rows.at(-1)?.lastEventHash === sealed.at(-1)?.entryHash ? "pass" : "fail", evidence: { rows: rows.length } });
  } catch (error) {
    checks.push({ id: "fixture:parse", status: "fail", evidence: { error: String(error) } });
  }
  checks.push(markerCheck("code:memory-store-v5", "packages/coding-agent/src/core/recon-profile.ts", [
    "type MemoryAppendTransactionV1",
    "type MemoryStoreVerificationV1",
    "function withMemoryStoreLock",
    "function appendMemoryEventTransaction",
    "function verifyMemoryStore",
    "function repairMemoryStoreIndex",
    "function snapshotMemoryStore",
    "function appendLaneRunMemoryEvent",
    "memory_store_v5:",
    "hash_chain_verified_before_append",
    "case_memory_rebuilt_from_events",
    "memory_auto_writeback"
  ]));
  checks.push(markerCheck("docs:memory-store-v5-readme", "README.md", ["Memory v5", "gate:memory-store", "store-report.json", "transactions/", "re_memory verify", "re_memory repair-index"]));
  checks.push(markerCheck("docs:memory-store-v5-recon", "packages/coding-agent/docs/recon.md", ["Memory v5", "re_memory verify", "re_memory repair-index", "store-snapshot.json"]));
  checks.push(markerCheck("profile:memory-store-v5", "repi-profile/SYSTEM.md", ["Memory v5", "transaction manifest", "re_memory verify", "re_memory repair-index"]));
  checks.push(markerCheck("npm:memory-store-script", "package.json", ["gate:memory-store", "memory-store-gate.mjs"]));
  const failed = checks.filter((check) => check.status !== "pass");
  const result = { kind: "repi-memory-store-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "memory-store", new Date().toISOString().replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI MemoryStoreV5 Gate");
    for (const check of checks) console.log(`- ${check.status === "pass" ? "PASS" : "FAIL"} ${check.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}

run();
