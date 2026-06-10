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
const FIXTURE_PATH = "fixtures/reverse-agent/structured-claim-merge.fixture.json";
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

function jsonQuery(content, query) {
	let value = JSON.parse(content);
	const parts = String(query ?? "").replace(/^\$\.?/, "").split(".").filter(Boolean);
	for (const part of parts) {
		if (Array.isArray(value)) value = value[Number(part)];
		else value = value?.[part];
	}
	return value;
}

function valuesEqual(actual, expected, op = "==") {
	if (op === "contains") return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? "").includes(String(expected));
	if (op === "includes_all") return Array.isArray(expected) && expected.every((item) => Array.isArray(actual) ? actual.includes(item) : String(actual ?? "").includes(String(item)));
	return JSON.stringify(actual) === JSON.stringify(expected);
}

function validateArtifactRef(ref, artifacts, options = {}) {
	const errors = [];
	const artifact = artifacts.get(ref.path);
	if (!artifact) return [`artifact_missing:${ref.path}`];
	const actualSha = sha256(artifact.content ?? "");
	if (ref.sha256 !== actualSha) errors.push(`artifact_sha_mismatch:${ref.path}`);
	if (!ref.jsonQuery) errors.push(`artifact_json_query_missing:${ref.path}`);
	else {
		try {
			const actual = jsonQuery(artifact.content ?? "{}", ref.jsonQuery);
			if (!valuesEqual(actual, ref.expected, ref.op)) errors.push(`artifact_json_query_mismatch:${ref.path}:${ref.jsonQuery}`);
		} catch (error) {
			errors.push(`artifact_json_query_error:${ref.path}:${String(error)}`);
		}
	}
	if (options.requireVerifier !== false && ref.verifierPass !== true) errors.push(`artifact_verifier_not_pass:${ref.path}`);
	return errors;
}

function validateClaimRows(merge, artifacts) {
	const errors = [];
	for (const claim of merge.claimRows ?? []) {
		if (!claim.claimId) errors.push("claim.claimId_missing");
		if (!claim.mergeKey) errors.push(`${claim.claimId}.mergeKey_missing`);
		if (!claim.artifactRefs?.length) errors.push(`${claim.claimId}.artifactRefs_missing`);
		for (const ref of claim.artifactRefs ?? []) errors.push(...validateArtifactRef(ref, artifacts, { requireVerifier: claim.status === "proven" }).map((error) => `${claim.claimId}.${error}`));
		for (const challenge of claim.challenges ?? []) {
			if (challenge.status !== "resolved") errors.push(`${claim.claimId}.unresolved_adversary_challenge:${challenge.challengeId}`);
		}
		if (claim.status === "proven" && !(claim.artifactRefs ?? []).some((ref) => ref.verifierPass === true)) errors.push(`${claim.claimId}.proven_without_verifier_pass`);
	}
	return errors;
}

function validateConflicts(merge) {
	const errors = [];
	const claims = new Map((merge.claimRows ?? []).map((claim) => [claim.claimId, claim]));
	const conflictsByClaim = new Map();
	for (const conflict of merge.conflictTable ?? []) {
		if ((conflict.claimIds ?? []).length < 2) errors.push(`${conflict.conflictId}.too_few_claims`);
		if (conflict.status !== "resolved") errors.push(`${conflict.conflictId}.unresolved_conflict`);
		if (!conflict.winnerClaimId || !claims.has(conflict.winnerClaimId)) errors.push(`${conflict.conflictId}.missing_winner`);
		if (!conflict.winningEvidenceRefs?.length) errors.push(`${conflict.conflictId}.missing_winning_evidence`);
		if (!conflict.resolutionReason) errors.push(`${conflict.conflictId}.missing_resolution_reason`);
		for (const claimId of conflict.claimIds ?? []) {
			const rows = conflictsByClaim.get(claimId) ?? [];
			rows.push(conflict);
			conflictsByClaim.set(claimId, rows);
		}
		for (const loser of (conflict.claimIds ?? []).filter((id) => id !== conflict.winnerClaimId)) {
			if (!(conflict.downgradeLosers ?? []).includes(loser)) errors.push(`${conflict.conflictId}.loser_not_downgraded:${loser}`);
		}
	}
	return { errors, conflictsByClaim };
}

function validatePromotionGate(merge, artifacts, conflictsByClaim) {
	const errors = [];
	const claims = new Map((merge.claimRows ?? []).map((claim) => [claim.claimId, claim]));
	for (const finalClaim of merge.promotionGate?.finalClaims ?? []) {
		const claim = claims.get(finalClaim.claimId);
		if (!claim) {
			errors.push(`final_claim_missing:${finalClaim.claimId}`);
			continue;
		}
		if (finalClaim.promotion !== "final_pass") errors.push(`${finalClaim.claimId}.promotion_not_final_pass`);
		if (claim.status !== "proven") errors.push(`${finalClaim.claimId}.final_pass_claim_not_proven:${claim.status}`);
		if (finalClaim.verifierPass !== true) errors.push(`${finalClaim.claimId}.final_pass_without_verifier_pass`);
		for (const challenge of claim.challenges ?? []) if (challenge.status !== "resolved") errors.push(`${finalClaim.claimId}.final_pass_unresolved_challenge:${challenge.challengeId}`);
		for (const conflict of conflictsByClaim.get(finalClaim.claimId) ?? []) {
			if (conflict.status !== "resolved") errors.push(`${finalClaim.claimId}.final_pass_unresolved_conflict:${conflict.conflictId}`);
			if (conflict.winnerClaimId !== finalClaim.claimId) errors.push(`${finalClaim.claimId}.final_pass_lost_conflict:${conflict.conflictId}`);
		}
		if (!finalClaim.artifactRefs?.length) errors.push(`${finalClaim.claimId}.final_pass_artifacts_missing`);
		for (const ref of finalClaim.artifactRefs ?? []) errors.push(...validateArtifactRef(ref, artifacts, { requireVerifier: true }).map((error) => `${finalClaim.claimId}.final_${error}`));
	}
	return errors;
}

function validateMerge(fixture) {
	const artifacts = artifactMap(fixture);
	const merge = fixture.structuredClaimMerge;
	const claimErrors = validateClaimRows(merge, artifacts);
	const conflict = validateConflicts(merge);
	const promotionErrors = validatePromotionGate(merge, artifacts, conflict.conflictsByClaim);
	const errors = [...claimErrors, ...conflict.errors, ...promotionErrors];
	return { status: errors.length ? "fail" : "pass", errors };
}

function mutateFixture(fixture, negative) {
	const clone = JSON.parse(JSON.stringify(fixture));
	const merge = clone.structuredClaimMerge;
	if (negative.mutate === "missingArtifactSha") merge.claimRows[0].artifactRefs[0].sha256 = "e".repeat(64);
	if (negative.mutate === "verifierFail") merge.promotionGate.finalClaims[0].verifierPass = false;
	if (negative.mutate === "unresolvedChallenge") merge.claimRows[0].challenges[0].status = "open";
	if (negative.mutate === "unresolvedConflict") merge.conflictTable[0].status = "unresolved";
	if (negative.mutate === "finalGapPromoted") {
		merge.claimRows.find((claim) => claim.claimId === "claim-authz-weak").status = "gap";
		merge.promotionGate.finalClaims = [{ ...merge.promotionGate.finalClaims[0], claimId: "claim-authz-weak" }];
	}
	if (negative.mutate === "jsonQueryMismatch") merge.claimRows[0].artifactRefs[0].expected = "wrong";
	if (negative.mutate === "missingWinnerEvidence") merge.conflictTable[0].winningEvidenceRefs = [];
	return clone;
}

function checkExpected(result, expected = {}) {
	const errors = [];
	for (const needle of expected.mustHaveErrors ?? []) if (!result.errors.some((error) => error.includes(needle))) errors.push(`missing expected error ${needle}`);
	for (const needle of expected.mustNotHaveErrors ?? []) if (result.errors.some((error) => error.includes(needle))) errors.push(`unexpected error ${needle}`);
	return errors;
}

function negativeCase(fixture, negative) {
	const result = validateMerge(mutateFixture(fixture, negative));
	const errors = checkExpected(result, negative.expected ?? {});
	return { id: `negative-${negative.id}`, status: errors.length ? "fail" : "pass", evidence: { validation: result, errors } };
}

function writeEvidenceFile(result) {
	if (!writeEvidence) return undefined;
	const stamp = result.generatedAt.replace(/[:.]/g, "-");
	const dir = join(root, ".repi-harness", "evidence", "structured-claim-merge", stamp);
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
		checks.push({ id: "fixture:parse", status: fixture.kind === "repi-structured-claim-merge-fixture" ? "pass" : "fail", evidence: { path: FIXTURE_PATH } });
	} catch (error) {
		checks.push({ id: "fixture:parse", status: "fail", evidence: { path: FIXTURE_PATH, error: String(error) } });
	}
	if (fixture) {
		const validation = validateMerge(fixture);
		const expectedErrors = checkExpected(validation, fixture.expected ?? {});
		checks.push({ id: "fixture:structured-merge-contract", status: validation.status === "pass" && expectedErrors.length === 0 ? "pass" : "fail", evidence: { validation, expectedErrors } });
		for (const negative of fixture.negativeCases ?? []) checks.push(negativeCase(fixture, negative));
	}
	checks.push(
		markerCheck("code:structured-claim-merge", "packages/coding-agent/src/core/recon-profile.ts", ["type StructuredClaimMergeV1", "function claimPromotionEvidenceContract", "function verifyStructuredClaimMergePromotion", "final_pass_requires_json_query", "unresolved_adversary_challenge_blocks_final"]),
		markerCheck("docs:structured-claim-merge", "README.md", ["Structured claim merge", "gate:structured-claim-merge", "final_pass_requires_json_query", "unresolved_adversary_challenge_blocks_final"]),
		markerCheck("npm:structured-claim-merge-script", "package.json", ["gate:structured-claim-merge", "structured-claim-merge-gate.mjs"]),
	);
	const failed = checks.filter((check) => check.status !== "pass");
	const result = { kind: "repi-structured-claim-merge-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), ok: failed.length === 0, root, checks };
	const evidencePath = writeEvidenceFile(result);
	if (evidencePath) result.evidencePath = evidencePath;
	if (json) console.log(JSON.stringify(result, null, 2));
	else {
		console.log("# REPI Structured Claim Merge Gate");
		console.log(`ok: ${result.ok}`);
		if (evidencePath) console.log(`evidence: ${evidencePath}`);
		for (const check of checks) console.log(`- ${check.id}: ${check.status}`);
		if (failed.length) console.log(`failed: ${failed.map((check) => check.id).join(", ")}`);
	}
	if (strict && failed.length) process.exitCode = 1;
}

main();
