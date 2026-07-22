import type { VerifierAssertion, VerifierStatus } from "../runtime-types.ts";
import { formatStrictClaimCheckSnapshot } from "./pure-claim.ts";
import type { CompilerArtifact } from "./types.ts";

export function compilerReportLines(compiler: CompilerArtifact): string[] {
	const bullet = (items: string[]) => (items.length ? items.map((item: any) => `- ${item}`) : ["- none"]);
	return [
		"# REPI Compiled Report",
		"",
		"## Outcome",
		"",
		...bullet(compiler.outcome),
		"",
		"## Key Evidence",
		"",
		...bullet(compiler.keyEvidence),
		"",
		"## Verification",
		"",
		`- verifier_artifact: ${compiler.verifierArtifact ?? "none"}`,
		`- supervisor_artifact: ${compiler.supervisorArtifact ?? "none"}`,
		`- status_summary: proved=${compiler.statusSummary.proved} weak=${compiler.statusSummary.weak} contradicted=${compiler.statusSummary.contradicted} missing=${compiler.statusSummary.missing}`,
		`- strict_claim_check: ${compiler.strictClaimCheck?.status ?? "missing"}`,
		`- claim_release_marker: ${compiler.strictClaimCheck?.markerPath ?? "missing"}`,
		`- claim_check_final_publish_ready: ${compiler.strictClaimCheck?.status === "pass" ? "yes" : "no"}`,
		"",
		"## Claim Check",
		"",
		"### Release Check Metadata",
		...bullet(compiler.releaseCheckMetadata),
		"",
		"### Supervisor Claim Check Policy",
		...bullet(compiler.claimCheckPolicy),
		"",
		"### Strict Claim Check",
		...formatStrictClaimCheckSnapshot(compiler.strictClaimCheck),
		"",
		"### Claim Check Result",
		...bullet(compiler.claimCheckResult),
		"",
		"### Structured Claim Merge Check",
		`- structured_claim_merge_status: ${compiler.structuredClaimMergeCheck?.status ?? "missing"}`,
		`- structured_claim_mergepath: ${compiler.structuredClaimMergeCheck?.mergePath ?? "missing"}`,
		`- final_claims: ${compiler.structuredClaimMergeCheck?.finalClaimCount ?? 0}`,
		`- blocked_claims: ${compiler.structuredClaimMergeCheck?.blockedClaimCount ?? 0}`,
		...bullet(compiler.structuredClaimMergeCheck?.errors ?? []),
		"",
		"## Operator Feedback",
		"",
		...bullet(compiler.operatorFeedback ?? []),
		"",
		"## Repro Commands",
		"",
		"```bash",
		...(compiler.reproCommands.length ? compiler.reproCommands : ["# no repro commands captured yet"]),
		"```",
		"",
		"## Contradictions",
		"",
		...bullet(compiler.contradictions),
		"",
		"## Gaps",
		"",
		...bullet(compiler.gaps),
		"",
		"## Next Step",
		"",
		...bullet(compiler.nextOperatorQueue),
		"",
	];
}
export function compilerStatusSummary(assertions: VerifierAssertion[]): Record<VerifierStatus, number> {
	return assertions.reduce<Record<VerifierStatus, number>>(
		(summary, assertion) => {
			summary[assertion.status] += 1;
			return summary;
		},
		{ proved: 0, weak: 0, contradicted: 0, missing: 0 },
	);
}
