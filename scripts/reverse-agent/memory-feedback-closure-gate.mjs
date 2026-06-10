#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_MEMORY_FEEDBACK_CLOSURE_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/memory-feedback-closure.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/memory-feedback-closure.fixture.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

function check(id, status, evidence = {}) {
	return { id, status: status ? "pass" : "fail", evidence };
}

function typeOk(value, type) {
	if (Array.isArray(type)) return type.some((item) => typeOk(value, item));
	if (type === "array") return Array.isArray(value);
	if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
	if (type === "integer") return Number.isInteger(value);
	if (type === "number") return typeof value === "number" && Number.isFinite(value);
	if (type === "null") return value === null;
	return typeof value === type;
}

function resolveRef(schema, ref) {
	if (!ref?.startsWith("#/$defs/")) throw new Error(`unsupported ref: ${ref}`);
	return schema.$defs?.[ref.slice("#/$defs/".length)];
}

function validateSchema(value, node, schema, path = "$") {
	if (!node) return [];
	if (node.$ref) return validateSchema(value, resolveRef(schema, node.$ref), schema, path);
	const errors = [];
	if (node.const !== undefined && value !== node.const) errors.push(`${path}: const ${JSON.stringify(node.const)} expected`);
	if (node.enum && !node.enum.includes(value)) errors.push(`${path}: enum ${node.enum.join("|")} expected`);
	if (node.type && !typeOk(value, node.type)) {
		errors.push(`${path}: type ${JSON.stringify(node.type)} expected`);
		return errors;
	}
	if (typeof value === "string") {
		if (node.minLength && value.length < node.minLength) errors.push(`${path}: minLength ${node.minLength}`);
		if (node.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: invalid date-time`);
	}
	if (Array.isArray(value)) {
		if (node.minItems && value.length < node.minItems) errors.push(`${path}: minItems ${node.minItems}`);
		if (node.items) value.forEach((item, index) => errors.push(...validateSchema(item, node.items, schema, `${path}[${index}]`)));
	}
	if (value && typeof value === "object" && !Array.isArray(value)) {
		for (const key of node.required ?? []) if (!(key in value)) errors.push(`${path}.${key}: required`);
		for (const [key, propSchema] of Object.entries(node.properties ?? {})) {
			if (key in value) errors.push(...validateSchema(value[key], propSchema, schema, `${path}.${key}`));
		}
	}
	return errors;
}

function validateFixture(fixture) {
	const required = [
		"MemoryFeedbackClosureV1",
		"feedback_event_links_source_event",
		"success_feedback_promotes",
		"failure_feedback_demotes",
		"pending_injection_requires_feedback_writeback",
		"feedback_closure_report_in_context_pack",
	];
	const gates = new Set(fixture.requiredGates ?? []);
	const scenarioIds = new Set((fixture.scenarios ?? []).map((scenario) => scenario.id));
	return {
		missingGates: required.filter((gate) => !gates.has(gate)),
		missingScenarios: [
			"success-feedback-promotes-injected-memory",
			"failure-feedback-demotes-injected-memory",
			"pending-injection-requires-writeback",
		].filter((id) => !scenarioIds.has(id)),
	};
}

function writeProbe(probePath, outPath, tempRoot) {
	const importUrl = pathToFileURL(join(root, "packages/coding-agent/src/core/recon-profile.ts")).href;
	writeFileSync(
		probePath,
		`
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createReconExtensionFactory } from ${JSON.stringify(importUrl)};
const outPath = ${JSON.stringify(outPath)};
const tempRoot = ${JSON.stringify(tempRoot)};
const agentDir = join(tempRoot, "agent");
const artifactPath = join(tempRoot, "verified-artifact.txt");
mkdirSync(agentDir, { recursive: true });
writeFileSync(artifactPath, "verified runtime artifact for memory feedback closure\\n");
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_BRANCH_ID = "memory-feedback-closure-branch";
const tools = new Map();
const fakePi = { registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); }, on() {}, appendEntry() {}, getSessionName: () => undefined, setSessionName() {}, sendMessage() {}, exec: async () => ({ code: 0, stdout: "memory-feedback-closure-probe", stderr: "", killed: false }) };
createReconExtensionFactory()(fakePi);
const memory = tools.get("re_memory");
if (!memory) throw new Error("missing re_memory tool");
async function appendSource(title) {
  const text = 'route=web outcome=success confidence=0.95 replayVerified=true playbookCandidate=true verifierRuleCandidate=true artifactPath=' + artifactPath + ' authz ownership verified replay re_verifier matrix re_replayer run curl /api/objects/' + title;
  const result = await memory.execute("memory-feedback-closure", { action: "append", scene: "web", title, text });
  return result.details.event;
}
async function main() {
  const promote = await appendSource("promote-source");
  const demote = await appendSource("demote-source");
  const pending = await appendSource("pending-source");
  await memory.execute("memory-feedback-closure", { action: "append", scene: "web", title: "promote feedback", text: 'route=web caseSignature=' + promote.caseSignature + ' outcome=success confidence=0.82 replayVerified=true memory_reuse_feedback_promote event=' + promote.id + ' strong evidence verified' });
  await memory.execute("memory-feedback-closure", { action: "append", scene: "web", title: "demote feedback", text: 'route=web caseSignature=' + demote.caseSignature + ' outcome=failure confidence=0.34 memory_reuse_feedback_demote event=' + demote.id + ' weak evidence failed' });
  const feedbackResult = await memory.execute("memory-feedback-closure", { action: "feedback" });
  const supervisorResult = await memory.execute("memory-feedback-closure", { action: "supervise" });
  const report = feedbackResult.details;
  const supervisor = JSON.parse(readFileSync(supervisorResult.details.supervisorReport, "utf8"));
  writeFileSync(outPath, JSON.stringify({ tempRoot, agentDir, promote, demote, pending, feedbackText: feedbackResult.content?.[0]?.text ?? "", supervisorText: supervisorResult.content?.[0]?.text ?? "", report, supervisor }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`,
		"utf8",
	);
}

function runProbe(tempRoot) {
	const probePath = join(tempRoot, "memory-feedback-closure-probe.ts");
	const outPath = join(tempRoot, "probe-result.json");
	writeProbe(probePath, outPath, tempRoot);
	const tsx = join(root, "node_modules", ".bin", "tsx");
	const result = spawnSync(tsx, ["--tsconfig", join(root, "tsconfig.json"), probePath], {
		cwd: root,
		env: { ...process.env, PI_OFFLINE: "1", REPI_OFFLINE: "1" },
		encoding: "utf8",
		maxBuffer: 40 * 1024 * 1024,
	});
	return { ...result, outPath, probePath };
}

function main() {
	const checks = [];
	const tempRoot = mkdtempSync(join(tmpdir(), "repi-memory-feedback-closure-"));
	let probeData;
	try {
		const schema = readJson(SCHEMA_PATH);
		const fixture = readJson(FIXTURE_PATH);
		checks.push(check("schema:parse", schema?.$defs?.MemoryFeedbackClosureReportV1 && schema?.$defs?.MemoryFeedbackClosureRowV1, { path: SCHEMA_PATH }));
		const fixtureEval = validateFixture(fixture);
		checks.push(check("fixture:feedback-closure-scenarios", fixtureEval.missingGates.length === 0 && fixtureEval.missingScenarios.length === 0, fixtureEval));
		const probe = runProbe(tempRoot);
		checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-4000) }));
		if (probe.status === 0 && existsSync(probe.outPath)) {
			probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
			const schemaErrors = validateSchema(probeData.report, schema.$defs.MemoryFeedbackClosureReportV1, schema, "$.report");
			const rows = new Map((probeData.report.rows ?? []).map((row) => [row.eventId, row]));
			checks.push(check("runtime:report-schema", schemaErrors.length === 0, { errors: schemaErrors, sha256: sha256(JSON.stringify(probeData.report)).slice(0, 24), rows: probeData.report.rows?.length }));
			checks.push(check("runtime:success-feedback-promotes", rows.get(probeData.promote.id)?.feedbackStatus === "promoted" && probeData.report.promotionReadyEventIds?.includes(probeData.promote.id), { row: rows.get(probeData.promote.id) }));
			checks.push(check("runtime:failure-feedback-demotes", rows.get(probeData.demote.id)?.feedbackStatus === "demoted" && probeData.report.demotionRequiredEventIds?.includes(probeData.demote.id), { row: rows.get(probeData.demote.id) }));
			checks.push(check("runtime:pending-feedback-tracked", rows.get(probeData.pending.id)?.feedbackStatus === "pending" && probeData.report.pendingFeedbackEventIds?.includes(probeData.pending.id), { row: rows.get(probeData.pending.id) }));
			checks.push(check("runtime:supervisor-demotes-failed-feedback", (probeData.supervisor.demotionQueue ?? []).some((decision) => decision.eventIds?.includes(probeData.demote.id) && /failure_feedback_demotes/.test(decision.reason)), { demotionQueue: probeData.supervisor.demotionQueue }));
			checks.push(check("runtime:required-gates", ["MemoryFeedbackClosureV1", "feedback_event_links_source_event", "success_feedback_promotes", "failure_feedback_demotes", "pending_injection_requires_feedback_writeback", "feedback_closure_report_in_context_pack"].every((gate) => probeData.report.requiredGates?.includes(gate)), { requiredGates: probeData.report.requiredGates }));
		} else {
			for (const id of ["runtime:report-schema", "runtime:success-feedback-promotes", "runtime:failure-feedback-demotes", "runtime:pending-feedback-tracked", "runtime:supervisor-demotes-failed-feedback", "runtime:required-gates"]) checks.push(check(id, false, { error: "probe output missing" }));
		}
		checks.push(check("code:feedback-closure-markers", ["MemoryFeedbackClosureV1", "buildMemoryFeedbackClosureReport", "formatMemoryFeedbackClosure", "memoryFeedbackClosureReportPath", "pending_feedback_after_injection", "failure_feedback_demotes"].every((marker) => readText("packages/coding-agent/src/core/recon-profile.ts").includes(marker)), { markers: ["MemoryFeedbackClosureV1", "buildMemoryFeedbackClosureReport", "formatMemoryFeedbackClosure"] }));
	} catch (error) {
		checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
	} finally {
		if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
	}
	const failed = checks.filter((row) => row.status !== "pass");
	const result = { kind: "repi-memory-feedback-closure-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, tempRoot: keepTmp ? tempRoot : undefined, checks };
	if (writeEvidence) {
		const dir = join(root, ".repi-harness", "evidence", "memory-feedback-closure", result.generatedAt.replace(/[:.]/g, "-"));
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
		if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
	}
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Memory Feedback Closure Gate");
		for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
		console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
	}
	if (strict && failed.length) process.exit(1);
}

main();
