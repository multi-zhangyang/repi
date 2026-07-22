/** Verifier compiler outcome pure. */
import type { VerifierStatus } from "../runtime-types.ts";
import type { VerifierArtifact } from "./types.ts";

export function compilerOutcome(verifier: VerifierArtifact, summary: Record<VerifierStatus, number>): string[] {
	const total = verifier.assertions.length;
	if (summary.contradicted > 0)
		return [
			`status=blocked_by_contradiction proved=${summary.proved}/${total} contradicted=${summary.contradicted}`,
			"claim boundary: contradictions must be repaired before final success claims.",
		];
	if (summary.missing > 0 || summary.weak > 0)
		return [
			`status=partial proved=${summary.proved}/${total} weak=${summary.weak} missing=${summary.missing}`,
			"claim boundary: report only proved assertions and keep weak/missing items in next_operator_queue.",
		];
	return [
		`status=ready proved=${summary.proved}/${total}`,
		"claim boundary: verifier found no weak, missing, or contradicted assertion.",
	];
}
