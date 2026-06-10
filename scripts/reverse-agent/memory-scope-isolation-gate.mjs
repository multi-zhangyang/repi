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
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_MEMORY_SCOPE_ISOLATION_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/memory-scope-isolation.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/memory-scope-isolation.fixture.json";
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
		"MemoryScopeIsolationV1",
		"scope_filter_by_mission_session_workspace_target",
		"cross_session_contamination_negative",
		"cross_workspace_contamination_blocks_injection",
		"cross_target_contamination_blocks_injection",
		"legacy_memory_scope_requires_manual_review",
		"scope_isolation_report_in_context_pack",
	];
	const gates = new Set(fixture.requiredGates ?? []);
	const scenarioIds = new Set((fixture.scenarios ?? []).map((scenario) => scenario.id));
	return {
		missingGates: required.filter((gate) => !gates.has(gate)),
		missingScenarios: [
			"same-scope-allows-injection",
			"cross-session-workspace-blocks-injection",
			"legacy-scope-warns-manual-review",
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
const workspaceA = join(tempRoot, "workspace-a");
const workspaceB = join(tempRoot, "workspace-b");
const artifactA = join(tempRoot, "artifact-a.txt");
const artifactB = join(tempRoot, "artifact-b.txt");
mkdirSync(agentDir, { recursive: true });
mkdirSync(workspaceA, { recursive: true });
mkdirSync(workspaceB, { recursive: true });
writeFileSync(artifactA, "verified cross-scope artifact\\n");
writeFileSync(artifactB, "verified same-scope artifact\\n");
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_BRANCH_ID = "memory-scope-main";
const tools = new Map();
const fakePi = { registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); }, on() {}, appendEntry() {}, getSessionName: () => undefined, setSessionName() {}, sendMessage() {}, exec: async () => ({ code: 0, stdout: "memory-scope-isolation-probe", stderr: "", killed: false }) };
createReconExtensionFactory()(fakePi);
const memory = tools.get("re_memory");
const context = tools.get("re_context");
if (!memory) throw new Error("missing re_memory tool");
if (!context) throw new Error("missing re_context tool");
function text(result) { return result?.content?.[0]?.text ?? ""; }
function artifactPath(output, label) {
  const match = new RegExp(label + ": (.+)").exec(output);
  if (!match?.[1]) throw new Error("missing artifact label " + label + " in output\\n" + output.slice(0, 1000));
  return match[1].trim();
}
function parseJsonArtifact(path) {
  const body = readFileSync(path, "utf8");
  const start = body.indexOf("\`\`\`json");
  if (start < 0) throw new Error("missing json block in " + path);
  const contentStart = body.indexOf("\\n", start);
  const end = body.indexOf("\`\`\`", contentStart + 1);
  if (contentStart < 0 || end < 0) throw new Error("unterminated json block in " + path);
  return JSON.parse(body.slice(contentStart + 1, end).trim());
}
async function append(title, options) {
  const text = [
    "target=" + options.target,
    "outcome=success",
    "confidence=0.98",
    "replayVerified=true",
    "playbookCandidate=true",
    "verifierRuleCandidate=true",
    "artifactPath=" + options.artifact,
    "authz ownership replay verified evidence claim route scope",
    "curl " + options.target + "/api/objects/" + title,
    "re_verifier run --target " + options.target,
  ].join(" ");
  const result = await memory.execute("memory-scope-isolation", { action: "append", scene: "Security general", title, text });
  return result.details.event;
}
async function main() {
  process.chdir(workspaceA);
  process.env.REPI_SESSION_ID = "session-a";
  const crossWorkspaceSameTarget = await append("cross-workspace-same-target", { target: "https://target-b.local", artifact: artifactA });
  const crossTarget = await append("cross-target", { target: "https://target-a.local", artifact: artifactA });

  process.chdir(workspaceB);
  process.env.REPI_SESSION_ID = "session-b";
  const sameScope = await append("same-scope", { target: "https://target-b.local", artifact: artifactB });

  const scopeResult = await memory.execute("memory-scope-isolation", { action: "scope", query: "https://target-b.local" });
  const scopeReportPath = scopeResult.details.scopeIsolationReportPath;
  const scopeReport = JSON.parse(readFileSync(scopeReportPath, "utf8"));
  const sedimentResult = await memory.execute("memory-scope-isolation", { action: "sediment", query: "https://target-b.local" });
  const sediment = JSON.parse(readFileSync(sedimentResult.details.sedimentationReport, "utf8"));
  const injectionPacket = JSON.parse(readFileSync(sedimentResult.details.injectionPacket, "utf8"));

  const eventsPath = join(agentDir, "recon", "memory", "events.jsonl");
  const events = readFileSync(eventsPath, "utf8").trim().split(/\\n+/).map((line) => JSON.parse(line));
  const legacyEventId = sameScope.id;
  const patched = events.map((event) => event.id === legacyEventId ? (({ memoryScope, ...legacy }) => legacy)(event) : event);
  writeFileSync(eventsPath, patched.map((event) => JSON.stringify(event)).join("\\n") + "\\n");
  const legacyResult = await memory.execute("memory-scope-isolation", { action: "scope", query: "https://target-b.local" });
  const legacyReport = legacyResult.details;

  const packOutput = text(await context.execute("memory-scope-isolation", { action: "pack", target: "https://target-b.local" }));
  const packPath = artifactPath(packOutput, "context_artifact");
  const pack = parseJsonArtifact(packPath);

  writeFileSync(outPath, JSON.stringify({
    tempRoot,
    agentDir,
    workspaceA,
    workspaceB,
    crossWorkspaceSameTarget,
    crossTarget,
    sameScope,
    scopeText: text(scopeResult),
    scopeReportPath,
    scopeReport,
    sedimentText: text(sedimentResult),
    sediment,
    injectionPacket,
    legacyText: text(legacyResult),
    legacyReport,
    packPath,
    packArtifactKinds: (pack.artifactIndex ?? []).map((artifact) => artifact.kind),
    pack,
  }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`,
		"utf8",
	);
}

function runProbe(tempRoot) {
	const probePath = join(tempRoot, "memory-scope-isolation-probe.ts");
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
	const tempRoot = mkdtempSync(join(tmpdir(), "repi-memory-scope-isolation-"));
	let probeData;
	try {
		const schema = readJson(SCHEMA_PATH);
		const fixture = readJson(FIXTURE_PATH);
		checks.push(check("schema:parse", schema?.$defs?.MemoryScopeV1 && schema?.$defs?.MemoryScopeIsolationReportV1, { path: SCHEMA_PATH }));
		const fixtureEval = validateFixture(fixture);
		checks.push(check("fixture:scope-isolation-scenarios", fixtureEval.missingGates.length === 0 && fixtureEval.missingScenarios.length === 0, fixtureEval));
		const probe = runProbe(tempRoot);
		checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-4000) }));
		if (probe.status === 0 && existsSync(probe.outPath)) {
			probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
			const schemaErrors = validateSchema(probeData.scopeReport, schema.$defs.MemoryScopeIsolationReportV1, schema, "$.scopeReport");
			const rows = new Map((probeData.scopeReport.rows ?? []).map((row) => [row.eventId, row]));
			const legacyRows = new Map((probeData.legacyReport.rows ?? []).map((row) => [row.eventId, row]));
			const crossWorkspaceRow = rows.get(probeData.crossWorkspaceSameTarget.id);
			const crossTargetRow = rows.get(probeData.crossTarget.id);
			const sameScopeRow = rows.get(probeData.sameScope.id);
			const legacyRow = legacyRows.get(probeData.sameScope.id);
			checks.push(check("runtime:report-schema", schemaErrors.length === 0, { errors: schemaErrors, sha256: sha256(JSON.stringify(probeData.scopeReport)).slice(0, 24), rows: probeData.scopeReport.rows?.length }));
			checks.push(check("runtime:same-scope-allows-injection", sameScopeRow?.verdict === "allow" && sameScopeRow?.blocksInjection === false, { row: sameScopeRow }));
			checks.push(check("runtime:cross-session-warns", crossWorkspaceRow?.reasons?.includes("cross_session_contamination") && crossWorkspaceRow?.verdict === "block", { row: crossWorkspaceRow }));
			checks.push(check("runtime:cross-workspace-blocks-injection", crossWorkspaceRow?.blocksInjection === true && crossWorkspaceRow?.recommendedAction === "quarantine" && crossWorkspaceRow?.reasons?.includes("cross_workspace_contamination"), { row: crossWorkspaceRow }));
			checks.push(check("runtime:cross-target-blocks-injection", crossTargetRow?.blocksInjection === true && crossTargetRow?.reasons?.includes("cross_target_contamination"), { row: crossTargetRow }));
			checks.push(check("runtime:legacy-memory-scope-manual-review", legacyRow?.verdict === "warn" && legacyRow?.recommendedAction === "manual-review" && legacyRow?.reasons?.includes("legacy_memory_scope_missing"), { row: legacyRow }));
			checks.push(check("runtime:sedimentation-blocks-cross-scope-injection", !(probeData.injectionPacket.entries ?? []).some((entry) => entry.eventId === probeData.crossWorkspaceSameTarget.id) && (probeData.sediment.entries ?? []).some((entry) => entry.eventId === probeData.crossWorkspaceSameTarget.id && entry.action === "quarantine" && entry.blockers?.some((reason) => reason.includes("scope_isolation:cross_workspace_contamination"))), { injectedEventIds: (probeData.injectionPacket.entries ?? []).map((entry) => entry.eventId), sedimentEntry: (probeData.sediment.entries ?? []).find((entry) => entry.eventId === probeData.crossWorkspaceSameTarget.id) }));
			checks.push(check("runtime:context-pack-has-scope-isolation", (probeData.packArtifactKinds ?? []).includes("memory_scope_isolation"), { artifactKinds: probeData.packArtifactKinds, packPath: probeData.packPath }));
			checks.push(check("runtime:required-gates", ["MemoryScopeIsolationV1", "scope_filter_by_mission_session_workspace_target", "cross_session_contamination_negative", "cross_workspace_contamination_blocks_injection", "cross_target_contamination_blocks_injection", "legacy_memory_scope_requires_manual_review", "scope_isolation_report_in_context_pack"].every((gate) => probeData.scopeReport.requiredGates?.includes(gate)), { requiredGates: probeData.scopeReport.requiredGates }));
		} else {
			for (const id of ["runtime:report-schema", "runtime:same-scope-allows-injection", "runtime:cross-session-warns", "runtime:cross-workspace-blocks-injection", "runtime:cross-target-blocks-injection", "runtime:legacy-memory-scope-manual-review", "runtime:sedimentation-blocks-cross-scope-injection", "runtime:context-pack-has-scope-isolation", "runtime:required-gates"]) checks.push(check(id, false, { error: "probe output missing" }));
		}
		checks.push(check("code:scope-isolation-markers", ["MemoryScopeIsolationV1", "buildMemoryScopeIsolationReport", "formatMemoryScopeIsolation", "memoryScopeIsolationReportPath", "scope_filter_by_mission_session_workspace_target", "cross_workspace_contamination_blocks_injection"].every((marker) => readText("packages/coding-agent/src/core/recon-profile.ts").includes(marker)), { markers: ["MemoryScopeIsolationV1", "buildMemoryScopeIsolationReport", "formatMemoryScopeIsolation"] }));
	} catch (error) {
		checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
	} finally {
		if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
	}
	const failed = checks.filter((row) => row.status !== "pass");
	const result = { kind: "repi-memory-scope-isolation-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, tempRoot: keepTmp ? tempRoot : undefined, checks };
	if (writeEvidence) {
		const dir = join(root, ".repi-harness", "evidence", "memory-scope-isolation", result.generatedAt.replace(/[:.]/g, "-"));
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
		if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
	}
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Memory Scope Isolation Gate");
		for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
		console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
	}
	if (strict && failed.length) process.exit(1);
}

main();
