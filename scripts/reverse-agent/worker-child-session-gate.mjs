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
const FIXTURE_PATH = "fixtures/reverse-agent/worker-child-session.fixture.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

function markerCheck(id, path, markers) {
	if (!existsSync(join(root, path))) return { id, status: "fail", evidence: { path, exists: false } };
	const text = readText(path);
	const missing = markers.filter((marker) => !text.includes(marker));
	return { id, status: missing.length ? "fail" : "pass", evidence: { path, missing, sha256: sha256(text).slice(0, 24) } };
}

function artifactMap(fixture) {
	return new Map((fixture.artifacts ?? []).map((artifact) => [artifact.path, artifact]));
}

function validatePolicy(batch) {
	const errors = [];
	const policy = batch.launchPolicy ?? {};
	if (batch.poolBridge?.childSessionRuntimeCaptured !== true) errors.push("poolBridge.childSessionRuntimeCaptured_not_true");
	if (policy.command !== "repi") errors.push("launchPolicy.command_not_repi");
	if (!(policy.args ?? []).includes("--recon")) errors.push("launchPolicy.missing_recon_arg");
	if (!policy.isolatedHome || /(^|\/)\.pi(\/|$)/.test(policy.isolatedHome)) errors.push("launchPolicy.isolated_home_invalid");
	if (!String(policy.profileDir ?? "").includes(".repi")) errors.push("launchPolicy.profileDir_not_repi");
	if (policy.importPiAuth !== false) errors.push("launchPolicy.import_pi_auth_not_false");
	if (policy.updateChecksDisabled !== true) errors.push("launchPolicy.update_checks_not_disabled");
	if (policy.telemetryDisabled !== true) errors.push("launchPolicy.telemetry_not_disabled");
	if (policy.cancelSignal !== "SIGTERM") errors.push("launchPolicy.cancelSignal_not_SIGTERM");
	if (!(policy.killAfterMs > 0 && policy.killAfterMs <= 10000)) errors.push("launchPolicy.killAfterMs_invalid");
	const allow = policy.envAllowlist ?? [];
	const deny = policy.envDenylist ?? [];
	for (const secret of ["GITHUB_TOKEN", "GITHUB_TOKEN_FOR_PUSH", "ANTHROPIC_AUTH_TOKEN", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]) {
		if (allow.includes(secret)) errors.push(`launchPolicy.secret_allowed:${secret}`);
	}
	for (const secret of ["GITHUB_TOKEN", "GITHUB_TOKEN_FOR_PUSH", "ANTHROPIC_AUTH_TOKEN"]) {
		if (!deny.includes(secret)) errors.push(`launchPolicy.secret_not_denied:${secret}`);
	}
	return errors;
}

function parseTime(ts) {
	const value = Date.parse(ts);
	return Number.isFinite(value) ? value : undefined;
}

function validateSessionHashes(batch, artifacts) {
	const errors = [];
	for (const session of batch.sessions ?? []) {
		for (const [label, pathField, hashField] of [["transcript", "transcriptPath", "transcriptSha256"], ["stdout", "stdoutPath", "stdoutSha256"], ["stderr", "stderrPath", "stderrSha256"]]) {
			const path = session.runtime?.[pathField];
			const expected = session.hashes?.[hashField];
			const artifact = artifacts.get(path);
			if (!artifact) {
				errors.push(`${session.sessionId}.${label}.missing_artifact`);
				continue;
			}
			const actual = sha256(artifact.content ?? "");
			if (expected !== actual) errors.push(`${session.sessionId}.${label}.hash_mismatch`);
		}
		if (!/^[a-f0-9]{64}$/.test(session.hashes?.toolCallDigest ?? "")) errors.push(`${session.sessionId}.toolCallDigest_invalid`);
	}
	return errors;
}

function validateProvider(session) {
	const errors = [];
	const provider = session.provider ?? {};
	if (!['openai-compatible', 'anthropic-compatible', 'local-openai'].includes(provider.format)) errors.push(`${session.sessionId}.provider.format_invalid`);
	if (!provider.modelId) errors.push(`${session.sessionId}.provider.modelId_missing`);
	if (!provider.baseUrlRef || !String(provider.baseUrlRef).startsWith("$")) errors.push(`${session.sessionId}.provider.baseUrlRef_not_env_ref`);
	if (!provider.apiKeyRef || !String(provider.apiKeyRef).startsWith("$") || /^sk-|^ghp_|^github_pat_/i.test(String(provider.apiKeyRef))) errors.push(`${session.sessionId}.provider.apiKeyRef_not_env_ref`);
	if (!(provider.contextWindow > 0)) errors.push(`${session.sessionId}.provider.contextWindow_invalid`);
	if (!(provider.maxTokens > 0 && provider.maxTokens <= provider.contextWindow)) errors.push(`${session.sessionId}.provider.maxTokens_invalid`);
	return errors;
}

function validateSessions(batch) {
	const errors = [];
	const dirs = new Set();
	for (const session of batch.sessions ?? []) {
		errors.push(...validateProvider(session));
		const dir = session.runtime?.sessionDir;
		if (!dir || dirs.has(dir)) errors.push(`${session.sessionId}.duplicate_or_missing_sessionDir`);
		dirs.add(dir);
		if (!String(dir ?? "").includes(".repi-harness/evidence/child-sessions")) errors.push(`${session.sessionId}.sessionDir_not_child_sessions`);
		if (!session.poolBridge?.poolId || session.poolBridge.poolId !== batch.poolId) errors.push(`${session.sessionId}.missing_pool_bridge`);
		if (!session.poolBridge?.mergeKey) errors.push(`${session.sessionId}.missing_mergeKey`);
		const start = parseTime(session.runtime?.startedAt);
		const end = parseTime(session.runtime?.endedAt);
		if (start === undefined || end === undefined || end < start) errors.push(`${session.sessionId}.invalid_time_window`);
		const elapsed = start !== undefined && end !== undefined ? end - start : 0;
		if (elapsed > batch.launchPolicy.timeoutMs && !["timeout", "cancelled"].includes(session.runtime?.status)) errors.push(`${session.sessionId}.timeout_not_marked`);
		if (session.runtime?.status === "timeout" && !session.runtime?.cancelledAt) errors.push(`${session.sessionId}.timeout_without_cancel`);
		if (session.retryBudget?.remaining !== Math.max(0, session.maxAttempts - session.attempt)) errors.push(`${session.sessionId}.retry_remaining_inconsistent`);
		if (session.retryBudget?.exhausted !== (session.attempt >= session.maxAttempts)) errors.push(`${session.sessionId}.retry_exhausted_inconsistent`);
		if (session.retryBudget?.exhausted && ["queued", "running", "retry_queued"].includes(session.runtime?.status)) errors.push(`${session.sessionId}.exhausted_still_running`);
		if ((session.resourceLease?.cpuSlots ?? 0) > (batch.resourceBudget?.cpuSlots ?? 0)) errors.push(`${session.sessionId}.cpuSlots_exceeds_budget`);
		if ((session.resourceLease?.memoryMb ?? 0) > (batch.resourceBudget?.memoryMb ?? 0)) errors.push(`${session.sessionId}.memoryMb_exceeds_budget`);
	}
	return errors;
}

function eventHash(event) {
	const { eventHash: _eventHash, ...withoutHash } = event;
	return sha256(JSON.stringify(withoutHash));
}

function validateClaimLedger(batch) {
	const errors = [];
	let prevHash = "0".repeat(64);
	const byClaim = new Map();
	for (const [index, event] of (batch.claimLedgerEvents ?? []).entries()) {
		if (event.prevHash !== prevHash) errors.push(`claimLedgerEvents[${index}].prevHash`);
		if (event.eventHash !== eventHash(event)) errors.push(`claimLedgerEvents[${index}].eventHash`);
		prevHash = event.eventHash;
		for (const claimId of [event.claimId, ...(event.claimIds ?? [])].filter(Boolean)) {
			const set = byClaim.get(claimId) ?? new Set();
			set.add(event.type);
			byClaim.set(claimId, set);
		}
	}
	for (const session of batch.sessions ?? []) {
		for (const claimId of session.poolBridge?.claimRefs ?? []) {
			const types = byClaim.get(claimId);
			for (const required of ["artifact_handoff", "claim", "validation", "challenge", "resolution"]) {
				if (!types?.has(required)) errors.push(`${session.sessionId}.${claimId}.missing_${required}`);
			}
		}
	}
	return errors;
}

function validateBatch(fixture) {
	const batch = fixture.providerRuntime;
	const artifacts = artifactMap(fixture);
	const errors = [
		...validatePolicy(batch),
		...validateSessionHashes(batch, artifacts),
		...validateSessions(batch),
		...validateClaimLedger(batch),
	];
	return { status: errors.length ? "fail" : "pass", errors };
}

function mutateFixture(fixture, negative) {
	const clone = JSON.parse(JSON.stringify(fixture));
	const batch = clone.providerRuntime;
	if (negative.mutate === "commandPi") batch.launchPolicy.command = "pi";
	if (negative.mutate === "sharedPiHome") batch.launchPolicy.isolatedHome = "/root/.pi/agent";
	if (negative.mutate === "secretAllowlist") batch.launchPolicy.envAllowlist.push("GITHUB_TOKEN_FOR_PUSH");
	if (negative.mutate === "importPiAuth") batch.launchPolicy.importPiAuth = true;
	if (negative.mutate === "updateChecksEnabled") batch.launchPolicy.updateChecksDisabled = false;
	if (negative.mutate === "literalApiKey") batch.sessions[0].provider.apiKeyRef = "sk-live-secret";
	if (negative.mutate === "transcriptHashMismatch") batch.sessions[0].hashes.transcriptSha256 = "e".repeat(64);
	if (negative.mutate === "timeoutWithoutCancel") {
		const session = batch.sessions.find((item) => item.runtime.status === "timeout");
		if (session) delete session.runtime.cancelledAt;
	}
	if (negative.mutate === "exhaustedStillRunning") {
		const session = batch.sessions.find((item) => item.retryBudget.exhausted);
		if (session) session.runtime.status = "running";
	}
	if (negative.mutate === "missingPoolBridge") delete batch.sessions[0].poolBridge;
	if (negative.mutate === "claimWithoutValidation") batch.claimLedgerEvents = batch.claimLedgerEvents.filter((event) => event.type !== "validation" || event.claimId !== "claim-child-authz");
	return clone;
}

function checkExpected(result, expected = {}) {
	const errors = [];
	for (const needle of expected.mustHaveErrors ?? []) if (!result.errors.some((error) => error.includes(needle))) errors.push(`missing expected error ${needle}`);
	for (const needle of expected.mustNotHaveErrors ?? []) if (result.errors.some((error) => error.includes(needle))) errors.push(`unexpected error ${needle}`);
	return errors;
}

function negativeCase(fixture, negative) {
	const result = validateBatch(mutateFixture(fixture, negative));
	const errors = checkExpected(result, negative.expected ?? {});
	return { id: `negative-${negative.id}`, status: errors.length ? "fail" : "pass", evidence: { validation: result, errors } };
}

function writeEvidenceFile(result) {
	if (!writeEvidence) return undefined;
	const stamp = result.generatedAt.replace(/[:.]/g, "-");
	const dir = join(root, ".repi-harness", "evidence", "worker-child-session", stamp);
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
		checks.push({ id: "fixture:parse", status: fixture.kind === "repi-worker-child-session-fixture" ? "pass" : "fail", evidence: { path: FIXTURE_PATH } });
	} catch (error) {
		checks.push({ id: "fixture:parse", status: "fail", evidence: { path: FIXTURE_PATH, error: String(error) } });
	}
	if (fixture) {
		const validation = validateBatch(fixture);
		const expectedErrors = checkExpected(validation, fixture.expected ?? {});
		checks.push({ id: "fixture:child-session-contract", status: validation.status === "pass" && expectedErrors.length === 0 ? "pass" : "fail", evidence: { validation, expectedErrors } });
		for (const negative of fixture.negativeCases ?? []) checks.push(negativeCase(fixture, negative));
	}
	checks.push(
		markerCheck("code:worker-child-session-runtime", "packages/coding-agent/src/core/recon-profile.ts", ["type WorkerChildSessionRuntimeBatchV1", "function workerChildSessionLaunchPolicy", "function verifyWorkerChildSessionRuntimeBatch", "workerChildSessionToWorkerRuntimePoolBridge"]),
		markerCheck("docs:worker-child-session", "README.md", ["Worker child-session runtime", "gate:worker-child-session", "isolatedHome", "provider runtime"]),
		markerCheck("npm:worker-child-session-script", "package.json", ["gate:worker-child-session", "worker-child-session-gate.mjs"]),
	);
	const failed = checks.filter((check) => check.status !== "pass");
	const result = { kind: "repi-worker-child-session-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, checks };
	const evidencePath = writeEvidenceFile(result);
	if (evidencePath) result.evidencePath = evidencePath;
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Worker Child Session Gate");
		console.log(`ok: ${result.ok}`);
		if (evidencePath) console.log(`evidence: ${evidencePath}`);
		for (const check of checks) console.log(`- ${check.id}: ${check.status}`);
		if (failed.length) console.log(`failed: ${failed.map((check) => check.id).join(", ")}`);
	}
	if (strict && failed.length) process.exitCode = 1;
}

main();
