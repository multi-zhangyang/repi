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

const FIXTURE_PATH = "fixtures/reverse-agent/memory-feedback.fixture.json";
const HEX64 = /^[a-f0-9]{64}$/;

function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}

function readText(path) {
	return readFileSync(join(root, path), "utf8");
}

function readJson(path) {
	return JSON.parse(readText(path));
}

function eventHash(event) {
	const { entryHash, ...withoutHash } = event;
	return sha256(JSON.stringify(withoutHash));
}

function tokens(text) {
	return [...new Set(String(text ?? "").toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/).filter((token) => token.length >= 2))];
}

function unique(values, limit = 80) {
	const seen = new Set();
	const out = [];
	for (const value of values) {
		const text = String(value ?? "").trim();
		if (!text || text === "none") continue;
		const key = text.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(text);
		if (out.length >= limit) break;
	}
	return out;
}

function routeMatches(eventRoute, route) {
	const left = String(eventRoute ?? "").trim().toLowerCase();
	const right = String(route ?? "").trim().toLowerCase();
	if (!right) return true;
	if (!left) return false;
	return left === right || left.includes(right) || right.includes(left);
}

function memoryTextForSearch(event) {
	return [
		event.task,
		event.route,
		event.target ?? "",
		event.source,
		event.outcome,
		...(event.domainTags ?? []),
		...(event.lessons ?? []),
		...(event.failurePatterns ?? []),
		...(event.reuseRules ?? []),
		...(event.commands ?? []),
		...(event.artifactHashes ?? []).map((artifact) => `${artifact.path} ${artifact.tier} ${artifact.sha256 ?? ""}`),
	].join("\n").toLowerCase();
}

function caseRowsFromEvents(events) {
	const rows = new Map();
	for (const event of events) {
		const previous = rows.get(event.caseSignature);
		const quality = {
			confidence: Math.max(previous?.quality?.confidence ?? 0, event.quality?.confidence ?? 0),
			replayVerified: Boolean(previous?.quality?.replayVerified || event.quality?.replayVerified),
			reuseCount: (previous?.quality?.reuseCount ?? 0) + (event.outcome === "success" ? 1 : 0),
			failureCount: (previous?.quality?.failureCount ?? 0) + (event.outcome === "failure" || event.outcome === "blocked" ? 1 : 0),
			lastUsefulAt: event.ts,
			decay: Math.max(0, (previous?.quality?.decay ?? 0) * 0.9 + (event.outcome === "failure" ? 0.2 : 0)),
		};
		rows.set(event.caseSignature, {
			caseSignature: event.caseSignature,
			route: event.route,
			target: event.target,
			eventIds: unique([...(previous?.eventIds ?? []), event.id], 80),
			commands: unique([...(previous?.commands ?? []), ...(event.commands ?? [])], 40),
			quality,
			lastEventHash: event.entryHash,
		});
	}
	return rows;
}

function scoreEvent(event, scenario, caseRows) {
	if (scenario.route && !routeMatches(event.route, scenario.route)) return { event, score: -999, reasons: ["route_mismatch"] };
	const queryTokens = tokens(scenario.query);
	const haystackTokens = new Set(tokens(memoryTextForSearch(event)));
	const reasons = [];
	let score = 0;
	for (const token of queryTokens) {
		if (haystackTokens.has(token)) {
			score += 4;
			reasons.push(`token:${token}`);
		}
	}
	if (scenario.route && routeMatches(event.route, scenario.route)) {
		score += 6;
		reasons.push("route");
	}
	if (scenario.target && String(event.target ?? "").toLowerCase().includes(String(scenario.target).toLowerCase())) {
		score += 6;
		reasons.push("target");
	}
	const timestamp = Date.parse(event.ts);
	const ageDays = Number.isNaN(timestamp) ? 365 : Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
	const quality = event.quality ?? {};
	const decay = Math.min(25, ageDays * 0.08 + Number(quality.decay ?? 0) * 12 + Number(quality.failureCount ?? 0) * 4);
	score += Number(quality.confidence ?? 0) * 10 + (quality.replayVerified ? 8 : 0) + Number(quality.reuseCount ?? 0) * 2;
	score -= decay;
	const caseRow = caseRows.get(event.caseSignature);
	if (caseRow) {
		const caseReuseBoost = Math.min(12, caseRow.quality.reuseCount * 1.5);
		const caseFailurePenalty = Math.min(18, caseRow.quality.failureCount * 3 + caseRow.quality.decay * 10);
		if (caseReuseBoost > 0) {
			score += caseReuseBoost;
			reasons.push("case-memory-feedback:reuse");
		}
		if (caseRow.quality.replayVerified && !quality.replayVerified) {
			score += 3;
			reasons.push("case-memory-feedback:verified");
		}
		if (caseFailurePenalty > 0) {
			score -= caseFailurePenalty;
			reasons.push("case-memory-feedback:penalty");
		}
	}
	if (event.outcome === "success") score += 6;
	if (event.outcome === "blocked" || event.outcome === "failure") score -= event.outcome === "failure" ? 10 : 8;
	if (queryTokens.length > 0 && !reasons.some((reason) => reason.startsWith("token:"))) score = -999;
	return { event, score, reasons, caseQuality: caseRow?.quality };
}

function searchMemory(events, scenario) {
	const caseRows = caseRowsFromEvents(events);
	return events
		.map((event) => scoreEvent(event, scenario, caseRows))
		.filter((hit) => hit.score > 0)
		.sort((left, right) => right.score - left.score || right.event.seq - left.event.seq)
		.slice(0, scenario.limit ?? 8);
}

function normalizeCommand(command, oldTarget, target) {
	let normalized = String(command ?? "").trim();
	if (!normalized) return undefined;
	if (target && oldTarget && oldTarget !== "<none>") normalized = normalized.split(oldTarget).join(target);
	if (target) normalized = normalized.replace(/<target>|<TARGET>|<URL>|<none>/gi, target);
	return /<target>|<TARGET>|<URL>|<none>/i.test(normalized) ? undefined : normalized;
}

function commandSuggestions(hits, scenario) {
	const seen = new Set();
	const commands = [];
	for (const hit of hits) {
		const event = hit.event;
		if (scenario.route && !routeMatches(event.route, scenario.route)) continue;
		if ((hit.caseQuality?.failureCount ?? 0) > (hit.caseQuality?.reuseCount ?? 0)) continue;
		if ((event.quality?.confidence ?? 0) < 0.45 || event.outcome === "failure") continue;
		for (const command of event.commands ?? []) {
			const normalized = normalizeCommand(command, event.target, scenario.target);
			if (!normalized || seen.has(normalized)) continue;
			seen.add(normalized);
			commands.push({ command: normalized, eventId: event.id, score: Number(hit.score.toFixed(2)) });
		}
	}
	return commands.slice(0, scenario.maxCommands ?? 8);
}

function validateHashChain(events) {
	const errors = [];
	let prevHash = "0".repeat(64);
	const ids = new Set();
	for (const [index, event] of events.entries()) {
		if (event.kind !== "repi-memory-event") errors.push(`events[${index}].kind`);
		if (event.seq !== index + 1) errors.push(`events[${index}].seq`);
		if (ids.has(event.id)) errors.push(`events[${index}].duplicate_id`);
		ids.add(event.id);
		if (event.prevHash !== prevHash) errors.push(`events[${index}].prevHash`);
		if (!HEX64.test(event.entryHash ?? "") || event.entryHash !== eventHash(event)) errors.push(`events[${index}].entryHash`);
		prevHash = event.entryHash;
	}
	return errors;
}

function checkScenario(events, scenario) {
	const hits = searchMemory(events, scenario);
	const suggestions = commandSuggestions(hits, scenario);
	const hitIds = hits.map((hit) => hit.event.id);
	const hitCases = hits.map((hit) => hit.event.caseSignature);
	const suggestionCommands = suggestions.map((item) => item.command);
	const errors = [];
	if (scenario.expectedFirstEventId && hitIds[0] !== scenario.expectedFirstEventId) errors.push(`expected first hit ${scenario.expectedFirstEventId}, got ${hitIds[0] ?? "none"}`);
	if (scenario.expectedFirstCaseSignature && hitCases[0] !== scenario.expectedFirstCaseSignature) errors.push(`expected first case ${scenario.expectedFirstCaseSignature}, got ${hitCases[0] ?? "none"}`);
	for (const id of scenario.mustRecallEventIds ?? []) if (!hitIds.includes(id)) errors.push(`missing recall ${id}`);
	const topWindow = hitIds.slice(0, scenario.mustNotRecallTopN ?? 3);
	for (const id of scenario.mustNotRecallEventIds ?? []) if (topWindow.includes(id)) errors.push(`bad top recall ${id}`);
	for (const command of scenario.mustSuggestCommands ?? []) if (!suggestionCommands.includes(command)) errors.push(`missing command ${command}`);
	for (const command of scenario.mustNotSuggestCommands ?? []) if (suggestionCommands.includes(command)) errors.push(`bad command ${command}`);
	if (scenario.minTopScore !== undefined && (hits[0]?.score ?? 0) < scenario.minTopScore) errors.push(`top score below ${scenario.minTopScore}`);
	return {
		id: scenario.id,
		status: errors.length ? "fail" : "pass",
		errors,
		topHits: hits.slice(0, 5).map((hit) => ({ id: hit.event.id, caseSignature: hit.event.caseSignature, score: Number(hit.score.toFixed(2)), reasons: hit.reasons, outcome: hit.event.outcome, caseQuality: hit.caseQuality })),
		suggestions,
	};
}

function markerCheck(id, path, markers) {
	if (!existsSync(join(root, path))) return { id, status: "fail", evidence: { path, exists: false } };
	const text = readText(path);
	const missing = markers.filter((marker) => !text.includes(marker));
	return { id, status: missing.length ? "fail" : "pass", evidence: { path, missing, sha256: sha256(text).slice(0, 24) } };
}

function writeEvidenceFile(result) {
	if (!writeEvidence) return undefined;
	const stamp = result.generatedAt.replace(/[:.]/g, "-");
	const dir = join(root, ".repi-harness", "evidence", "memory-feedback", stamp);
	mkdirSync(dir, { recursive: true });
	const path = join(dir, "result.json");
	writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
	return path;
}

function main() {
	const checks = [];
	let fixture;
	try {
		fixture = readJson(FIXTURE_PATH);
		checks.push({ id: "fixture:parse", status: fixture.kind === "repi-memory-feedback-fixture" ? "pass" : "fail", evidence: { path: FIXTURE_PATH, scenarioCount: fixture.scenarios?.length ?? 0 } });
	} catch (error) {
		checks.push({ id: "fixture:parse", status: "fail", evidence: { path: FIXTURE_PATH, error: String(error) } });
	}
	if (fixture) {
		const chainErrors = validateHashChain(fixture.events ?? []);
		checks.push({ id: "fixture:hash-chain", status: chainErrors.length ? "fail" : "pass", evidence: { errors: chainErrors.slice(0, 20), events: fixture.events?.length ?? 0 } });
		for (const scenario of fixture.scenarios ?? []) checks.push({ id: `scenario:${scenario.id}`, status: checkScenario(fixture.events ?? [], scenario).status, evidence: checkScenario(fixture.events ?? [], scenario) });
	}
	checks.push(
		markerCheck("code:memory-feedback-loop", "packages/coding-agent/src/core/recon-profile.ts", [
			"function latestCaseMemoryBySignature",
			"type MemoryReuseFeedbackReference",
			"function memoryReuseFeedbackReferences",
			"function appendMemoryReuseFeedback",
			"memory_reuse_feedback_promote",
			"memory_reuse_feedback_demote",
			"appendMemoryReuseFeedback(effectivePack, result, analysis, artifactPath)",
			"case-memory-feedback:reuse",
			"case-memory-feedback:penalty",
			"caseRow.quality.failureCount > caseRow.quality.reuseCount",
		]),
		markerCheck("docs:memory-feedback", "README.md", ["Memory reuse feedback", "gate:memory-feedback", "在线学习闭环"]),
		markerCheck("npm:memory-feedback-script", "package.json", ["gate:memory-feedback", "memory-feedback-gate.mjs"]),
	);
	const failed = checks.filter((check) => check.status !== "pass");
	const result = { kind: "repi-memory-feedback-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, checks };
	const evidencePath = writeEvidenceFile(result);
	if (evidencePath) result.evidencePath = evidencePath;
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Memory Feedback Gate");
		console.log(`ok: ${result.ok}`);
		if (evidencePath) console.log(`evidence: ${evidencePath}`);
		for (const check of checks) console.log(`- ${check.id}: ${check.status}`);
		if (failed.length) console.log(`failed: ${failed.map((check) => check.id).join(", ")}`);
	}
	if (strict && failed.length) process.exitCode = 1;
}

main();
