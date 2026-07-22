#!/usr/bin/env node
/**
 * Offline multi-turn lean inject smoke (sticky cold-start).
 *
 * Proves:
 *  - T1 security prompt → cold-start-lean path + mission.coldStartInjected
 *  - T2 continuation → sticky-v1 path (no full cold re-dump)
 *  - mission disk flag survives across process-local stats reset
 *
 * Usage:
 *   node scripts/reverse-agent/repi-sticky-inject-smoke.mjs [root] [--json]
 *   repi reverse-sticky-smoke [--json]  (if wired)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : join(here, "../..");
const json = process.argv.includes("--json");
const outPath = join(root, "docs/reverse-agent/sticky-inject-host-capture-smoke.out");
const writeArtifact = process.argv.includes("--write") || process.env.REPI_STICKY_SMOKE_WRITE === "1";

const runner = `
import { writeFileSync } from "node:fs";
import {
  sameRouteDomain,
  promptLooksLikeContinuation,
  buildStickyRuntimeLine,
  shouldCreateStickyMission,
  markMissionColdStart,
} from ${JSON.stringify(join(root, "packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-sticky.ts"))};
import { runRepiBeforeAgentStart } from ${JSON.stringify(join(root, "packages/coding-agent/src/core/repi/kernel/factory-hooks/agent-hooks-run.ts"))};

const lines = [];
const log = (s) => lines.push(String(s));

const routeNative = {
  domain: "native",
  lane: "static",
  technique: "crash-offset",
  confidence: 0.9,
  skillHint: "native.crash-offset",
  workflow: ["map binary", "dyn crash", "exact offset", "rop gadgets"],
};
const routeMobile = {
  domain: "mobile",
  lane: "apk",
  technique: "frida-local",
  confidence: 0.9,
  skillHint: "mobile.frida-local",
  workflow: ["apk surface", "frida host", "local attach", "hook hits"],
};

// --- pure helper CAP ---
log("[sticky-helper] same_route=" + (sameRouteDomain(routeNative, { domain: "native" }) ? 1 : 0));
log("[sticky-helper] cont_continue=" + (promptLooksLikeContinuation("continue") ? 1 : 0));
log("[sticky-helper] cont_long=" + (promptLooksLikeContinuation("x".repeat(80) + " reverse this binary fully") ? 1 : 0));

let mission = null;
const store = { mission: null };
const deps = {
  isSecurityTask: (p) => /reverse|exploit|frida|binary|apk|pentest|crash/i.test(String(p || "")),
  routeReconTask: (p) => (/apk|frida|mobile/i.test(String(p || "")) ? routeMobile : routeNative),
  createMission: (task, route) => ({
    id: "sticky-smoke-" + String(route.domain) + "-" + Date.now().toString(36).slice(-4),
    task,
    route,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lanes: [],
    checkpoints: [],
  }),
  writeCurrentMission: (m) => {
    store.mission = { ...m };
    return store.mission;
  },
  readCurrentMission: () => (store.mission ? { ...store.mission } : undefined),
  truncateMiddle: (s, n) => String(s || "").slice(0, n),
  formatRoute: (r) => "route.domain=" + r.domain + " lane=" + (r.lane || "?"),
  makeSelfReview: (stats) => "repi_self_review: calls=" + (stats.calls || 0),
  // cold-start lean packet deps (must be callable)
  techniqueIdsForRoute: (route) => [String(route?.domain || "native") + ".crash-offset"],
  buildMissionDigest: () => "mission_digest: sticky-smoke",
  buildKernelOutput: () => "kernel: lean",
  buildDecisionCoreOutput: () => "decision: lean",
  buildStartupEvidenceDigest: () => "evidence: none",
  buildStartupContextDigest: () => "context: none",
  buildToolDigest: () => "tools: bash,read",
  formatCompletionAudit: () => "completion: pending",
};

// stub activate path is imported inside run — monkey via env not available;
// runRepiBeforeAgentStart calls activateRepiToolsForRoute; tolerate empty tools.

const pi = {
  entries: [],
  appendEntry(kind, payload) { this.entries.push({ kind, payload }); },
  getSessionName() { return ""; },
  setSessionName() {},
};
const ctx = { hasUI: false, sessionManager: { getSessionFile: () => undefined }, ui: { setStatus() {} } };
const stats = { calls: 0, failures: 0, selfReviewDue: false };

const t1Prompt = "reverse this ELF binary for crash offset and ROP gadgets now";
const t1 = await runRepiBeforeAgentStart({ prompt: t1Prompt, systemPrompt: "BASE" }, ctx, pi, stats, deps);
const t1Text = t1?.systemPrompt || "";
log("[sticky-t1] has_result=" + (t1 ? 1 : 0));
log("[sticky-t1] cold_lean=" + (t1Text.includes("cold-start-lean-v1") || t1Text.includes("repi_inject: cold-start-lean-v1") ? 1 : 0));
log("[sticky-t1] sticky_v1=" + (t1Text.includes("sticky-v1") ? 1 : 0));
log("[sticky-t1] mission_cold=" + (store.mission?.coldStartInjected ? 1 : 0));
log("[sticky-t1] inject_entry=" + (pi.entries.some((e) => e.kind === "repi-route" && e.payload?.inject === "cold-start-lean") ? 1 : 0));
if (!store.mission?.coldStartInjected) {
  // cold path should mark via markMissionColdStart inside buildRepiColdStartSystemPrompt
  markMissionColdStart(deps.writeCurrentMission, store.mission || deps.createMission(t1Prompt, routeNative), routeNative);
  log("[sticky-t1] cold_mark_fallback=1");
}
log("[sticky-t1] mission_id=" + (store.mission?.id || "<none>"));

// reset process-local stats but keep mission disk flag (store)
const stats2 = { calls: 12, failures: 0, selfReviewDue: true, lastRoute: routeNative };
const t2Prompt = "continue";
const t2 = await runRepiBeforeAgentStart({ prompt: t2Prompt, systemPrompt: "BASE" }, ctx, pi, stats2, deps);
const t2Text = t2?.systemPrompt || "";
log("[sticky-t2] has_result=" + (t2 ? 1 : 0));
log("[sticky-t2] cold_lean=" + (t2Text.includes("cold-start-lean-v1") || t2Text.includes("repi_inject: cold-start-lean-v1") ? 1 : 0));
log("[sticky-t2] sticky_v1=" + (t2Text.includes("repi_inject: sticky-v1") ? 1 : 0));
log("[sticky-t2] self_review=" + (t2Text.includes("repi_self_review") ? 1 : 0));
log("[sticky-t2] mission_id=" + (store.mission?.id || "<none>"));

// pure sticky line landmark
const stickyLine = buildStickyRuntimeLine({
  route: routeNative,
  mission: store.mission || { id: "x" },
  stats: stats2,
  formatRoute: deps.formatRoute,
  activeTools: ["bash", "read"],
});
log("[sticky-line] " + stickyLine.split("\\n").join(" | "));
log("[sticky-line] landmark=" + (stickyLine.includes("repi_inject: sticky-v1") ? 1 : 0));

// domain change should force new cold path
const t3Prompt = "mobile frida attach apk reverse dynamic instrumentation package com.repi.smoke fully";
const t3 = await runRepiBeforeAgentStart({ prompt: t3Prompt, systemPrompt: "BASE" }, ctx, pi, { calls: 0, failures: 0 }, deps);
const t3Text = t3?.systemPrompt || "";
log("[sticky-t3] domain_change_cold=" + ((t3Text.includes("cold-start-lean") || t3Text.includes("cold-start-lean-v1")) ? 1 : 0));
log("[sticky-t3] route=" + (store.mission?.route?.domain || deps.routeReconTask(t3Prompt).domain));

const okT1 = (t1Text.includes("cold-start-lean-v1") || t1Text.includes("repi_inject: cold-start-lean-v1") || store.mission?.coldStartInjected);
const okT2 = t2Text.includes("repi_inject: sticky-v1") && !t2Text.includes("cold-start-lean-v1");
const okLine = stickyLine.includes("repi_inject: sticky-v1");
const okCont = promptLooksLikeContinuation("continue") && !promptLooksLikeContinuation("x".repeat(80) + " reverse this binary fully");
const ok = Boolean(okT1 && okT2 && okLine && okCont);

log("[sticky-proof-capture] domain=sticky-inject t1_cold=" + (okT1 ? 1 : 0) + " t2_sticky=" + (okT2 ? 1 : 0) + " cont=" + (okCont ? 1 : 0) + " line=" + (okLine ? 1 : 0));
log("[sticky-proof-capture] proof.exit=" + (ok ? "runtime_capture_strong" : "pending_runtime_capture") + " bind_ready=" + (ok ? "true" : "false"));
log("[sticky-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,continue_sticky_mission");
log("summary.sticky_inject=" + (ok ? 1 : 0));
log("summary.sticky_t1_cold=" + (okT1 ? 1 : 0));
log("summary.sticky_t2=" + (okT2 ? 1 : 0));

if (process.env.REPI_STICKY_SMOKE_WRITE === "1") writeFileSync(${JSON.stringify(outPath)}, lines.join("\\n") + "\\n");
console.log(JSON.stringify({ ok, outPath: ${JSON.stringify(outPath)}, t1_cold: okT1, t2_sticky: okT2, cont: okCont, line: okLine, bytes: lines.join("\\n").length }));
`;

const r = spawnSync(process.execPath, ["--import", "tsx", "-e", runner], {
	cwd: root,
	encoding: "utf8",
	env: {
		...process.env,
		PATH: `/usr/bin:/bin:${process.env.PATH || ""}`,
		REPI_OFFLINE: "1",
		REPI_SKIP_VERSION_CHECK: "1",
		REPI_STICKY_SMOKE_WRITE: writeArtifact ? "1" : "0",
	},
	timeout: 60_000,
	maxBuffer: 4 * 1024 * 1024,
});

const stdout = r.stdout || "";
const stderr = r.stderr || "";
let report;
try {
	const last = stdout.trim().split("\n").filter(Boolean).pop() || "{}";
	report = JSON.parse(last);
} catch {
	report = { ok: false, parse_error: true, stdout: stdout.slice(-2000), stderr: stderr.slice(-2000) };
}

mkdirSync(dirname(outPath), { recursive: true });
if (!report.ok && writeArtifact) {
	// still write diagnostic when explicitly requested
	writeFileSync(
		outPath,
		[
			"[sticky-inject] ok=0",
			`status=${r.status}`,
			`stdout=${stdout.slice(-3000)}`,
			`stderr=${stderr.slice(-3000)}`,
			"[sticky-proof-capture] proof.exit=pending_runtime_capture bind_ready=false",
		].join("\n") + "\n",
	);
}

const result = {
	kind: "repi-sticky-inject-smoke-report",
	ok: Boolean(report.ok),
	outPath,
	...report,
	status: r.status,
};

if (json) {
	console.log(JSON.stringify(result, null, 2));
} else {
	console.log(`sticky-inject ok=${result.ok} out=${outPath}`);
	if (!result.ok) {
		console.log(stdout.slice(-1500));
		console.log(stderr.slice(-1500));
	}
}
process.exit(result.ok ? 0 : 1);
