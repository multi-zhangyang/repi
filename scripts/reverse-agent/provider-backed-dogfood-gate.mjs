#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { failureRepairFromGap, validateFailureRepairBatch } from "./failure-repair-ledger.mjs";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const liveRequested = argv.includes("--live") || process.env.REPI_PROVIDER_BACKED_DOGFOOD_LIVE === "1";
const FIXTURE_PATH = "fixtures/reverse-agent/provider-backed-dogfood.fixture.json";
const SCHEMA_PATH = "schemas/reverse-agent/provider-backed-dogfood.schema.json";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function safeJson(text, fallback = null) { try { return JSON.parse(text); } catch { return fallback; } }
function readJson(path) { return JSON.parse(readFileSync(join(root, path), "utf8")); }
function fileMeta(path) {
	if (!path) return { path: "", exists: false };
	const full = path.startsWith("/") ? path : join(root, path);
	if (!existsSync(full)) return { path, exists: false };
	const bytes = readFileSync(full);
	const st = statSync(full);
	return { path: full.replace(`${root}/`, ""), exists: true, bytes: bytes.length, sha256: sha256(bytes), mtime: st.mtime.toISOString() };
}
function hasLiteralSecret(value) {
	return /\bsk-[A-Za-z0-9_-]{8,}\b|\bghp_[A-Za-z0-9_]{16,}\b|\bgithub_pat_[A-Za-z0-9_]{16,}\b|(?:AUTH_TOKEN|API_KEY|PASSWORD|SECRET)=(?!<redacted>)\S+/i.test(String(value ?? ""));
}
function redact(value) {
	return String(value ?? "")
		.replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "<redacted:api-key>")
		.replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/(?:AUTH_TOKEN|API_KEY|PASSWORD|SECRET)=\S+/gi, (m) => m.split("=")[0] + "=<redacted>");
}
function markerCheck(id, path, markers) {
	const full = join(root, path);
	if (!existsSync(full)) return { id, status: "fail", evidence: { path, exists: false } };
	const text = readFileSync(full, "utf8");
	const missing = markers.filter((marker) => !text.includes(marker));
	return { id, status: missing.length ? "fail" : "pass", evidence: { path, missing, sha256: sha256(text).slice(0, 24) } };
}
function buildConfig() {
	return {
		provider: process.env.REPI_PROVIDER_BACKED_DOGFOOD_PROVIDER || process.env.RECON_AGENT_PROVIDER || "",
		model: process.env.REPI_PROVIDER_BACKED_DOGFOOD_MODEL || process.env.RECON_AGENT_MODEL || process.env.ANTHROPIC_MODEL || "",
		roles: (process.env.REPI_PROVIDER_BACKED_DOGFOOD_ROLES || process.env.RECON_PARALLEL_ROLES || "mapper,verifier").split(",").map((x) => x.trim()).filter(Boolean),
		timeoutMs: Math.max(60000, Math.min(1200000, Number(process.env.REPI_PROVIDER_BACKED_DOGFOOD_TIMEOUT_MS || process.env.RECON_AGENT_TIMEOUT_MS || 420000) || 420000)),
		roleRetries: Math.max(0, Math.min(2, Number(process.env.REPI_PROVIDER_BACKED_DOGFOOD_RETRIES || process.env.RECON_ROLE_RETRIES || 0) || 0)),
		maxToolCalls: Math.max(1, Math.min(8, Number(process.env.REPI_PROVIDER_BACKED_DOGFOOD_MAX_TOOL_CALLS || process.env.RECON_PARALLEL_MAX_TOOL_CALLS || 3) || 3)),
		maxWords: Math.max(120, Math.min(1200, Number(process.env.REPI_PROVIDER_BACKED_DOGFOOD_MAX_WORDS || process.env.RECON_PARALLEL_MAX_WORDS || 360) || 360)),
	};
}
function configProblems(config) {
	const problems = [];
	if (!config.provider) problems.push("missing_env:REPI_PROVIDER_BACKED_DOGFOOD_PROVIDER");
	if (!config.model) problems.push("missing_env:REPI_PROVIDER_BACKED_DOGFOOD_MODEL");
	if (config.roles.length < 2) problems.push("requires_at_least_two_roles");
	return problems;
}
function resultArtifactFromStdout(stdout) {
	const parsed = safeJson(String(stdout || "").match(/\{[\s\S]*\}\s*$/)?.[0] ?? stdout, null);
	if (!parsed?.artifactDir) return { parsed, resultPath: "", result: null };
	const resultPath = join(parsed.artifactDir, "result.json");
	const full = resultPath.startsWith("/") ? resultPath : join(root, resultPath);
	return { parsed, resultPath, result: existsSync(full) ? safeJson(readFileSync(full, "utf8"), null) : null };
}
function releaseGateFromRunner(runner, artifact, config) {
	const workerCount = Number(runner?.parallelPlan?.workerCount ?? runner?.roles?.length ?? 0);
	const manifestCount = Array.isArray(runner?.subagentRuntimeManifests) ? runner.subagentRuntimeManifests.length : Number(runner?.subagentRuntimeManifestFiles?.length || 0);
	const synthesizerCaptured = Boolean(runner?.synthesizer || runner?.synthesizerRun || (runner?.subagentRuntimeManifests || []).some((row) => row.roleId === "synthesizer"));
	const modelCalls = Number(runner?.totals?.modelCalls || 0);
	const toolCalls = Number(runner?.totals?.toolCalls || 0);
	const toolResults = Number(runner?.totals?.toolResults || 0);
	const gates = runner?.gates || {};
	return {
		planOnlyNotPromoted: Boolean(artifact?.artifactDir?.includes("/remote/agent-parallel-dogfood/") && !artifact?.artifactDir?.includes("agent-dogfood-plan-only") && runner?.planOnly !== true),
		providerBacked: Boolean(config.provider && config.model && runner?.provider === config.provider && runner?.model === config.model),
		multiWorker: workerCount >= 2,
		synthesizerCaptured,
		modelCallsCaptured: modelCalls >= workerCount + (synthesizerCaptured ? 1 : 0) && gates.allRolesModelCalled === true,
		toolResultsCaptured: toolCalls > 0 && toolResults >= toolCalls && gates.toolResultsCaptured === true && gates.allRolesUsedTools === true,
		subagentManifestsCaptured: manifestCount >= workerCount + (synthesizerCaptured ? 1 : 0) && gates.subagentRuntimeManifestsCaptured === true,
		runtimeClaimLedgerCaptured: Boolean(gates.runtimeClaimLedgerCaptured && Number(runner?.claimLedgerEventCount || 0) >= 5 && /^[a-f0-9]{64}$/.test(String(runner?.claimLedgerTipHash || ""))),
		nonMockRuntime: Boolean(gates.nonMockRuntimeExpected && runner?.runtimeAudit?.nonMockRuntimeExpected === true && runner?.runtimeAudit?.offlineRequested === false && runner?.runtimeAudit?.mockEnvDetected === false),
		parallelOverlap: Boolean(runner?.parallel?.anyOverlap),
		orchestrationPlatformSplitPreserved: Boolean(gates.orchestrationPlatformScoreSplit && runner?.hardEvalControl?.scores),
	};
}
function validateProviderBackedDogfood(report) {
	const errors = [];
	if (report.kind !== "ProviderBackedDogfoodReleaseGateV1") errors.push("kind");
	if (report.mode === "skipped") {
		if (!report.skipReason) errors.push("skipped_without_reason");
		if (report.liveRequested) errors.push("live_requested_but_skipped");
		return { ok: errors.length === 0, errors };
	}
	if (report.mode !== "live") errors.push("mode");
	if (!report.liveRequested) errors.push("live_not_requested");
	if (!report.providerName) errors.push("providerName");
	if (!/^[a-f0-9]{64}$/.test(String(report.modelIdSha256 || ""))) errors.push("modelIdSha256");
	if (report.artifact?.exists !== true || !/^[a-f0-9]{64}$/.test(String(report.artifact?.sha256 || ""))) errors.push("artifact.sha256");
	if (!/^agent-parallel-dogfood-confirmed/.test(String(report.runner?.verdict || ""))) errors.push("runner.verdict");
	for (const [key, value] of Object.entries(report.releaseGate || {})) if (value !== true) errors.push(`releaseGate.${key}`);
	if (hasLiteralSecret(JSON.stringify({ report: { ...report, runner: undefined }, stdoutTail: report.run?.stdoutTail, stderrTail: report.run?.stderrTail }))) errors.push("literalSecret");
	return { ok: errors.length === 0, errors };
}
function buildSkippedReport(reason, configProblems = []) {
	return { kind: "ProviderBackedDogfoodReleaseGateV1", schemaVersion: 1, generatedAt: new Date().toISOString(), mode: "skipped", liveRequested: false, ok: true, skipReason: reason, configProblems, releaseGate: { planOnlyNotPromoted: false, providerBacked: false, multiWorker: false, synthesizerCaptured: false, modelCallsCaptured: false, toolResultsCaptured: false, subagentManifestsCaptured: false, runtimeClaimLedgerCaptured: false, nonMockRuntime: false, parallelOverlap: false, orchestrationPlatformSplitPreserved: false } };
}
function buildLiveReport({ config, run, parsed, resultPath, runner }) {
	const artifact = { ...fileMeta(resultPath), artifactDir: runner?.artifactDir || parsed?.artifactDir || "", resultPath };
	const releaseGate = releaseGateFromRunner(runner, artifact, config);
	const report = {
		kind: "ProviderBackedDogfoodReleaseGateV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		mode: "live",
		liveRequested: true,
		ok: false,
		providerName: config.provider,
		modelIdSha256: sha256(config.model),
		rolesRequested: config.roles,
		artifact,
		run: { code: run.status, signal: run.signal, stdoutSha256: sha256(run.stdout || ""), stderrSha256: sha256(run.stderr || ""), stdoutTail: redact(String(run.stdout || "").slice(-2000)), stderrTail: redact(String(run.stderr || "").slice(-2000)) },
		runner: runner ? {
			verdict: runner.verdict,
			provider: runner.provider,
			model: runner.model,
			parallelPlan: runner.parallelPlan,
			totals: runner.totals,
			parallel: runner.parallel,
			runtimeAudit: runner.runtimeAudit,
			gates: runner.gates,
			synthesizer: runner.synthesizer,
			claimLedgerPath: runner.claimLedgerPath,
			claimLedgerEventCount: runner.claimLedgerEventCount,
			claimLedgerTipHash: runner.claimLedgerTipHash,
			subagentRuntimeManifestIndex: runner.subagentRuntimeManifestIndex,
			subagentRuntimeManifests: runner.subagentRuntimeManifests,
			hardEvalControl: runner.hardEvalControl,
		} : null,
		releaseGate,
	};
	const validation = validateProviderBackedDogfood(report);
	report.ok = validation.ok;
	report.validation = validation;
	if (!validation.ok) {
		const { failure, repair } = failureRepairFromGap({ root, source: "provider-backed-dogfood", scope: "provider-backed-dogfood:live", category: "runtime_failed", status: "repair_queued", failedGates: validation.errors, reason: `provider-backed dogfood failed release gate: ${validation.errors.join(",")}`, attempt: 1, maxAttempts: 2, commands: ["npm run gate:provider-backed-dogfood -- --live"], artifacts: [resultPath].filter(Boolean), providerAllowed: true, liveAllowed: true, paused: false, requiredSecrets: ["provider credentials for selected REPI provider"], verificationCommand: "npm run gate:provider-backed-dogfood -- --live", regressionGates: ["gate:provider-backed-dogfood", "gate:runtime-ledger-quality"] });
		report.failureLedgerEvents = [failure];
		report.repairQueue = [repair];
		report.failureRepairValidation = validateFailureRepairBatch({ failures: [failure], repairs: [repair] });
	}
	return report;
}
function runLive(config) {
	const env = { ...process.env, RECON_AGENT_PROVIDER: config.provider, RECON_AGENT_MODEL: config.model, RECON_PARALLEL_ROLES: config.roles.join(","), RECON_SYNTHESIZER: "1", RECON_ROLE_RETRIES: String(config.roleRetries), RECON_PARALLEL_MAX_TOOL_CALLS: String(config.maxToolCalls), RECON_PARALLEL_MAX_WORDS: String(config.maxWords), RECON_AGENT_TIMEOUT_MS: String(config.timeoutMs), REPI_SKIP_VERSION_CHECK: "1", REPI_SKIP_PACKAGE_UPDATE_CHECK: "1", PI_SKIP_VERSION_CHECK: "1", PI_SKIP_PACKAGE_UPDATE_CHECK: "1" };
	const args = ["bench/recon-remote/agent-dogfood/parallel-run.mjs"];
	const run = spawnSync(process.execPath, args, { cwd: root, env, encoding: "utf8", timeout: config.timeoutMs + 60000, maxBuffer: 50 * 1024 * 1024 });
	const { parsed, resultPath, result } = resultArtifactFromStdout(run.stdout);
	return buildLiveReport({ config, run, parsed, resultPath, runner: result });
}
function mutateReport(report, mutate) {
	const clone = JSON.parse(JSON.stringify(report));
	if (mutate === "planOnlyPromoted") { clone.artifact.artifactDir = ".repi-harness/evidence/runtime/agent-dogfood-plan-only/example"; clone.releaseGate.planOnlyNotPromoted = false; }
	if (mutate === "singleWorker") { clone.runner.workerCount = 1; if (clone.runner.parallelPlan) clone.runner.parallelPlan.workerCount = 1; clone.releaseGate.multiWorker = false; }
	if (mutate === "missingModelCalls") { clone.runner.totals.modelCalls = 0; clone.releaseGate.modelCallsCaptured = false; }
	if (mutate === "missingSynthesizer") { clone.runner.synthesizerCaptured = false; clone.releaseGate.synthesizerCaptured = false; }
	if (mutate === "missingClaimLedger") { clone.runner.claimLedgerEventCount = 0; clone.releaseGate.runtimeClaimLedgerCaptured = false; }
	if (mutate === "nonMockFalse") { clone.runner.runtimeAudit.nonMockRuntimeExpected = false; clone.releaseGate.nonMockRuntime = false; }
	if (mutate === "secretLeak") clone.run = { stdoutTail: "OPENAI_API_KEY=sk-leaked-provider-backed-dogfood-token" };
	return clone;
}
function negativeCheck(valid, negative) {
	const mutated = mutateReport(valid, negative.mutate);
	const validation = validateProviderBackedDogfood(mutated);
	const missing = (negative.expectedErrors || []).filter((needle) => !validation.errors.some((error) => error.includes(needle)));
	return { id: negative.id, status: !validation.ok && missing.length === 0 ? "pass" : "fail", evidence: { validation, missing } };
}
function writeEvidenceFile(result) {
	if (!writeEvidence) return undefined;
	const stamp = result.generatedAt.replace(/[:.]/g, "-");
	const dir = join(root, ".repi-harness", "evidence", "provider-backed-dogfood", stamp);
	mkdirSync(dir, { recursive: true });
	const path = join(dir, "result.json");
	writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
	writeFileSync(join(dir, "artifact.md"), formatText(result), "utf8");
	return path.replace(`${root}/`, "");
}
function buildResult() {
	const config = buildConfig();
	let report;
	const configIssues = configProblems(config);
	const checks = [];
	if (!liveRequested) report = buildSkippedReport("set REPI_PROVIDER_BACKED_DOGFOOD_LIVE=1 or pass --live to run provider-backed multi-worker dogfood", []);
	else if (configIssues.length) report = { ...buildSkippedReport("live requested but provider-backed dogfood config is incomplete", configIssues), liveRequested: true, ok: false };
	else report = runLive(config);
	const validation = validateProviderBackedDogfood(report);
	checks.push({ id: report.mode === "skipped" && !liveRequested ? "runtime:provider-backed-dogfood-skipped" : "runtime:provider-backed-dogfood-live", status: validation.ok ? "pass" : "fail", evidence: { validation, mode: report.mode, configProblems: report.configProblems || [] } });
	const fixture = readJson(FIXTURE_PATH);
	const validFixtureValidation = validateProviderBackedDogfood(fixture.validScenario);
	checks.push({ id: "fixture:provider-backed-dogfood-valid", status: validFixtureValidation.ok ? "pass" : "fail", evidence: validFixtureValidation });
	for (const negative of fixture.negativeCases || []) checks.push(negativeCheck(fixture.validScenario, negative));
	checks.push(
		markerCheck("schema:provider-backed-dogfood", SCHEMA_PATH, ["ProviderBackedDogfoodReleaseGateV1", "planOnlyNotPromoted", "providerBacked", "multiWorker", "runtimeClaimLedgerCaptured"]),
		markerCheck("fixture:provider-backed-dogfood", FIXTURE_PATH, ["repi-provider-backed-dogfood-fixture", "negative:dogfood-plan-only-promoted", "negative:dogfood-missing-model-calls", "negative:dogfood-nonmock-false"]),
		markerCheck("runner:agent-dogfood-provider-backed", "bench/recon-remote/agent-dogfood/parallel-run.mjs", ["agent-parallel-dogfood-confirmed", "subagentRuntimeManifests", "runtimeClaimLedgerCaptured", "nonMockRuntimeExpected"]),
		markerCheck("npm:provider-backed-dogfood", "package.json", ["gate:provider-backed-dogfood", "provider-backed-dogfood-gate.mjs"]),
		markerCheck("harness:provider-backed-dogfood", "scripts/reverse-agent/repi-top-harness.mjs", ["provider:provider-backed-dogfood-optional-live", "child:gate:provider-backed-dogfood"]),
		markerCheck("autonomy:provider-backed-dogfood", "scripts/reverse-agent/autonomy-control-plane.mjs", ["provider_backed_dogfood_gate", "ProviderBackedDogfoodReleaseGateV1", "provider-backed agent-dogfood"]),
		markerCheck("docs:provider-backed-dogfood", "README.md", ["Provider-backed dogfood", "gate:provider-backed-dogfood", "REPI_PROVIDER_BACKED_DOGFOOD_LIVE"]),
	);
	const result = { kind: "repi-provider-backed-dogfood-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: checks.every((check) => check.status === "pass") && report.ok !== false, root, mode: report.mode, liveRequested, report, checks };
	return result;
}
function formatText(result) {
	const lines = ["# REPI Provider-backed Dogfood Gate", "", `generated_at: ${result.generatedAt}`, `ok: ${result.ok}`, `mode: ${result.mode}`, "", "## Checks"];
	for (const check of result.checks) lines.push(`- ${check.id}: ${check.status}`);
	if (result.evidencePath) lines.push("", `evidence: ${result.evidencePath}`);
	return `${lines.join("\n")}\n`;
}
function main() {
	const result = buildResult();
	result.evidencePath = writeEvidenceFile(result);
	if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	else process.stdout.write(formatText(result));
	if (strict && !result.ok) process.exitCode = 1;
}
export { buildResult, validateProviderBackedDogfood };
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
