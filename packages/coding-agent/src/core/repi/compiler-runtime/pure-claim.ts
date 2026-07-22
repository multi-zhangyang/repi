/** Compiler claim-check / evidence helpers. */

import type { StrictClaimCheckSnapshot } from "../runtime-types/claim.ts";
import type { CompilerArtifact } from "./types.ts";

export { latestCompilerClaimCheckInputs } from "./pure-claim-inputs.ts";
// Landmark: latestOrBuildSupervisor / structuredClaimMergeCheckFromSwarm (body in pure-claim-inputs.ts)

export function compilerClaimCheckReady(compiler: CompilerArtifact): boolean {
	return (
		compiler.mode === "final" &&
		compiler.strictClaimCheck?.status === "pass" &&
		(compiler.structuredClaimMergeCheck?.status ?? "missing") !== "blocked"
	);
}

export function compilerContradictions(verifier: any): string[] {
	const contradictionAssertions = verifier.assertions
		.filter((assertion: any) => assertion.status === "contradicted")
		.map((assertion: any) => `${assertion.id}: ${assertion.counterEvidence.join(" | ") || assertion.claim}`);
	return Array.from(new Set([...verifier.contradictions, ...contradictionAssertions])).slice(0, 24);
}

export function compilerKeyEvidence(verifier: any): string[] {
	const proved = verifier.assertions.filter((assertion: any) => assertion.status === "proved");
	const lines = proved.flatMap((assertion: any) => [
		`${assertion.id}: ${assertion.claim}`,
		...assertion.evidence.slice(0, 3).map((item: any) => `  evidence: ${item}`),
	]);
	const feedbackEvidence = (verifier.operatorFeedback ?? [])
		.filter((row: any) => /category=(strong_evidence|replay_or_exploit_candidate|worker_retry_progress)/i.test(row))
		.map((row: any) => `operator_feedback: ${row}`);
	if (lines.length || feedbackEvidence.length)
		return Array.from(new Set([...lines, ...feedbackEvidence])).slice(0, 36);
	return Array.from(
		new Set([
			`verifier_artifact: ${verifier.sourceArtifacts[0] ?? "none"}`,
			...verifier.sourceArtifacts.slice(0, 8).map((artifact: any) => `source_artifact: ${artifact}`),
		]),
	);
}

export function formatStrictClaimCheckSnapshot(snapshot?: StrictClaimCheckSnapshot): string[] {
	if (!snapshot) return ["- strict_claim_check.status=missing"];
	return [
		`- status=${snapshot.status}`,
		`- marker_path=${snapshot.markerPath ?? "missing"}`,
		`- generated_at=${snapshot.generatedAt ?? "missing"}`,
		`- mode=${snapshot.mode ?? "missing"}`,
		`- platform_required_score=${snapshot.platformRequiredScore ?? "missing"}`,
		`- orchestration_score=${snapshot.orchestrationScore ?? "missing"}`,
		`- required_gaps=${snapshot.requiredGaps.length}`,
		...(snapshot.requiredGaps.length
			? snapshot.requiredGaps.slice(0, 12).map((gap: any) => `- required_gap=${gap}`)
			: []),
	];
}
