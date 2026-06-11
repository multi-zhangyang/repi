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
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_KNOWLEDGE_SCOPE_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/knowledge-scope-isolation.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/knowledge-scope-isolation.fixture.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

function check(id, status, evidence = {}) {
	return { id, status: status ? "pass" : "fail", evidence };
}

function validateFixture(fixture) {
	const required = [
		"KnowledgeScopeIsolationV1",
		"MemoryScopeIsolationV1",
		"scope_filter_by_mission_session_workspace_target",
		"knowledge_graph_scope_filter_blocks_quarantined_artifacts",
		"knowledge_graph_command_hints_exclude_scope_blocked_sources",
		"knowledge_scope_isolation_report_in_artifact",
	];
	const gates = new Set(fixture.requiredGates ?? []);
	const scenarioIds = new Set((fixture.scenarios ?? []).map((scenario) => scenario.id));
	return {
		missingGates: required.filter((gate) => !gates.has(gate)),
		missingScenarios: [
			"blocked-artifact-excluded-from-command-hints",
			"allowed-artifact-remains-queryable",
			"scope-report-embedded-in-knowledge-graph",
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
const runsDir = join(agentDir, "recon", "evidence", "runs");
mkdirSync(agentDir, { recursive: true });
mkdirSync(workspaceA, { recursive: true });
mkdirSync(workspaceB, { recursive: true });
mkdirSync(runsDir, { recursive: true });
const blockedArtifact = join(runsDir, "2026-06-10-blocked-target-a.md");
const allowedArtifact = join(runsDir, "2026-06-10-allowed-target-b.md");
writeFileSync(blockedArtifact, ["# blocked target-a runtime", "", "curl https://target-a.local/api/blocked-only-command", "blocked-only-command should never become command_strategy_hints"].join("\\n"));
writeFileSync(allowedArtifact, ["# allowed target-b runtime", "", "curl https://target-b.local/api/allowed-command", "allowed-command should remain reusable"].join("\\n"));
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_BRANCH_ID = "knowledge-scope-main";
const tools = new Map();
const fakePi = { registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); }, on() {}, appendEntry() {}, getSessionName: () => undefined, setSessionName() {}, sendMessage() {}, exec: async () => ({ code: 0, stdout: "knowledge-scope-probe", stderr: "", killed: false }) };
createReconExtensionFactory()(fakePi);
const memory = tools.get("re_memory");
const knowledge = tools.get("re_knowledge_graph");
if (!memory) throw new Error("missing re_memory tool");
if (!knowledge) throw new Error("missing re_knowledge_graph tool");
function text(result) { return result?.content?.[0]?.text ?? ""; }
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
  const body = [
    "target=" + options.target,
    "outcome=success",
    "confidence=0.98",
    "replayVerified=true",
    "playbookCandidate=true",
    "verifierRuleCandidate=true",
    "artifactPath=" + options.artifact,
    "runtime artifact command " + options.command,
    "curl " + options.target + "/api/" + options.command,
    "re_verifier run --target " + options.target,
  ].join(" ");
  const result = await memory.execute("knowledge-scope", { action: "append", scene: "web", title, text: body });
  return result.details.event;
}
async function main() {
  process.chdir(workspaceA);
  process.env.REPI_SESSION_ID = "session-a";
  const blockedEvent = await append("blocked-target-a", { target: "https://target-a.local", artifact: blockedArtifact, command: "blocked-only-command" });

  process.chdir(workspaceB);
  process.env.REPI_SESSION_ID = "session-b";
  const allowedEvent = await append("allowed-target-b", { target: "https://target-b.local", artifact: allowedArtifact, command: "allowed-command" });

  const graphResult = await knowledge.execute("knowledge-scope", { action: "build", target: "https://target-b.local" });
  const graphPath = graphResult.details.path;
  const graph = parseJsonArtifact(graphPath);
  const scopeReport = JSON.parse(readFileSync(graph.knowledgeScopeIsolation.reportPath, "utf8"));
  writeFileSync(outPath, JSON.stringify({
    tempRoot,
    agentDir,
    blockedArtifact,
    allowedArtifact,
    blockedEvent,
    allowedEvent,
    graphText: text(graphResult),
    graphPath,
    graph,
    scopeReport,
  }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`,
		"utf8",
	);
}

function runProbe(tempRoot) {
	const probePath = join(tempRoot, "knowledge-scope-isolation-probe.ts");
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
	const tempRoot = mkdtempSync(join(tmpdir(), "repi-knowledge-scope-isolation-"));
	let probeData;
	try {
		const schema = readJson(SCHEMA_PATH);
		const fixture = readJson(FIXTURE_PATH);
		checks.push(check("schema:parse", schema?.$defs?.KnowledgeScopeIsolationV1 && schema?.$defs?.KnowledgeScopeIsolationSourceV1, { path: SCHEMA_PATH }));
		const fixtureEval = validateFixture(fixture);
		checks.push(check("fixture:knowledge-scope-scenarios", fixtureEval.missingGates.length === 0 && fixtureEval.missingScenarios.length === 0, fixtureEval));
		const probe = runProbe(tempRoot);
		checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-4000) }));
		if (probe.status === 0 && existsSync(probe.outPath)) {
			probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
			const scope = probeData.graph.knowledgeScopeIsolation;
			const commandText = JSON.stringify(probeData.graph.commandStrategyHints ?? []);
			const similarityText = JSON.stringify(probeData.graph.similarityIndex ?? []);
			const scopeRows = new Map((scope?.sourceRows ?? []).map((row) => [row.path, row]));
			checks.push(check("runtime:scope-isolation-embedded", scope?.MemoryScopeIsolationV1 === true && scope?.reportPath && probeData.graphText.includes("knowledge_scope_isolation"), { scope }));
			checks.push(check("runtime:blocked-artifact-quarantined", scope?.quarantinedSourceArtifacts?.includes(probeData.blockedArtifact) && scopeRows.get(probeData.blockedArtifact)?.blocksKnowledgeReuse === true, { row: scopeRows.get(probeData.blockedArtifact), quarantined: scope?.quarantinedSourceArtifacts }));
			checks.push(check("runtime:allowed-artifact-retained", scope?.allowedSourceArtifacts?.includes(probeData.allowedArtifact) && scopeRows.get(probeData.allowedArtifact)?.verdict === "allow", { row: scopeRows.get(probeData.allowedArtifact), allowed: scope?.allowedSourceArtifacts }));
			checks.push(check("runtime:command-hints-exclude-blocked", !commandText.includes("blocked-only-command") && !commandText.includes("target-a.local"), { commandStrategyHints: probeData.graph.commandStrategyHints }));
			checks.push(check("runtime:command-hints-include-allowed", commandText.includes("allowed-command") && commandText.includes("target-b.local"), { commandStrategyHints: probeData.graph.commandStrategyHints }));
			checks.push(check("runtime:similarity-excludes-blocked-artifact", !similarityText.includes(probeData.blockedArtifact) && similarityText.includes(probeData.allowedArtifact), { similarityIndex: probeData.graph.similarityIndex }));
			checks.push(check("runtime:scope-report-blocked-event", probeData.scopeReport.blockedEventIds?.includes(probeData.blockedEvent.id) && !probeData.scopeReport.blockedEventIds?.includes(probeData.allowedEvent.id), { blockedEventIds: probeData.scopeReport.blockedEventIds, allowedEventId: probeData.allowedEvent.id }));
			checks.push(check("runtime:required-gates", ["KnowledgeScopeIsolationV1", "MemoryScopeIsolationV1", "scope_filter_by_mission_session_workspace_target", "knowledge_graph_scope_filter_blocks_quarantined_artifacts", "knowledge_graph_command_hints_exclude_scope_blocked_sources", "knowledge_scope_isolation_report_in_artifact"].every((gate) => scope?.requiredGates?.includes(gate)), { requiredGates: scope?.requiredGates }));
		} else {
			for (const id of ["runtime:scope-isolation-embedded", "runtime:blocked-artifact-quarantined", "runtime:allowed-artifact-retained", "runtime:command-hints-exclude-blocked", "runtime:command-hints-include-allowed", "runtime:similarity-excludes-blocked-artifact", "runtime:scope-report-blocked-event", "runtime:required-gates"]) checks.push(check(id, false, { error: "probe output missing" }));
		}
		checks.push(check("code:knowledge-scope-markers", ["KnowledgeScopeIsolationV1", "buildKnowledgeScopeIsolation", "knowledge_graph_scope_filter_blocks_quarantined_artifacts", "knowledge_graph_command_hints_exclude_scope_blocked_sources", "scope_filter_by_mission_session_workspace_target"].every((marker) => readText("packages/coding-agent/src/core/recon-profile.ts").includes(marker)), { markers: ["KnowledgeScopeIsolationV1", "buildKnowledgeScopeIsolation"] }));
	} catch (error) {
		checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
	} finally {
		if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
	}
	const failed = checks.filter((row) => row.status !== "pass");
	const result = { kind: "repi-knowledge-scope-isolation-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, tempRoot: keepTmp ? tempRoot : undefined, checks };
	if (writeEvidence) {
		const dir = join(root, ".repi-harness", "evidence", "knowledge-scope-isolation", result.generatedAt.replace(/[:.]/g, "-"));
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
		if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
	}
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Knowledge Scope Isolation Gate");
		for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
		console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
	}
	if (strict && failed.length) process.exit(1);
}

main();
