/** Build claim check result rows (reverse next when blocked). */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { StrictClaimCheckSnapshot } from "../runtime-types.ts";
import { strictClaimCheckSnapshot } from "./strict.ts";

export function buildClaimCheckResult(
	releaseCheckMetadata: string[] = [],
	claimCheckPolicy: string[] = [],
	strictCheck: StrictClaimCheckSnapshot = strictClaimCheckSnapshot(),
): string[] {
	const rows = [
		`claim_check.release_metadata_rows=${releaseCheckMetadata.length}`,
		`claim_check.policy_rows=${claimCheckPolicy.length}`,
		`claim_check.strict_status=${strictCheck.status}`,
		`claim_check.marker_path=${strictCheck.markerPath ?? "missing"}`,
		`claim_check.required_gaps=${strictCheck.requiredGaps.length}`,
		`claim_check.platform_required_score=${strictCheck.platformRequiredScore ?? "missing"}`,
		`claim_check.orchestration_score=${strictCheck.orchestrationScore ?? "missing"}`,
		`claim_check.final_publish_ready=${strictCheck.status === "pass" ? "yes" : "no"}`,
		...(strictCheck.requiredGaps.length
			? strictCheck.requiredGaps.slice(0, 12).map((gap: any) => `claim_check.required_gap=${gap}`)
			: []),
	];
	if (strictCheck.status !== "pass") {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: JSON.stringify(strictCheck),
			includeGates: true,
		}).slice(0, 3);
		for (const cmd of reverseNext) rows.push(`claim_check.reverse_next=${cmd}`);
	}
	return rows;
}
