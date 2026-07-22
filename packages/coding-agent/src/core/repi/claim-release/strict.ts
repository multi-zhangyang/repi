/** Claim release strict check + gap labels. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import type { ClaimReleaseGap, StrictClaimCheckSnapshot } from "../runtime-types.ts";
import { evidenceClaimReleaseDir } from "../storage.ts";
import { latestClaimReleaseMarkerPath, parseClaimReleaseMarker, writeLocalClaimReleaseMarker } from "./io.ts";

export function claimReleaseGapLabel(gap: ClaimReleaseGap): string {
	return [
		gap.claimId ? `claim=${gap.claimId}` : undefined,
		gap.scope ? `scope=${gap.scope}` : undefined,
		gap.checkpoint ? `checkpoint=${gap.checkpoint}` : undefined,
		gap.kind ? `kind=${gap.kind}` : undefined,
	]
		.filter(Boolean)
		.join(" ");
}

export function strictClaimCheckSnapshot(): StrictClaimCheckSnapshot {
	ensureReconStorage();
	const markerPath = latestClaimReleaseMarkerPath() ?? writeLocalClaimReleaseMarker();
	if (!markerPath) {
		return {
			status: "missing",
			requiredGaps: [],
			claimCheckResult: [
				"strict_claim_check.status=missing",
				"strict_claim_check.marker_path=missing",
				"strict_claim_check.final_publish_ready=no",
				`strict_claim_check.next=write ${join(evidenceClaimReleaseDir(), "local-runtime-*/result.json")}`,
			],
		};
	}
	const marker = parseClaimReleaseMarker(markerPath);
	if (!marker) {
		return {
			status: "blocked",
			markerPath,
			requiredGaps: ["marker_parse_error"],
			claimCheckResult: [
				"strict_claim_check.status=blocked",
				`strict_claim_check.marker_path=${markerPath}`,
				"strict_claim_check.parse=fail",
				"strict_claim_check.final_publish_ready=no",
			],
		};
	}
	const rawGaps = marker.requiredGaps ?? marker.checks?.checkAndScores?.requiredGaps ?? [];
	const requiredGaps = rawGaps.map(claimReleaseGapLabel).filter(Boolean);
	// reverse-heavy markers must not pass without runtime proof exit / bind readiness signal
	const markerBlob = JSON.stringify(marker);
	// Require reverse proof only when the marker itself asserts reverse/web proof scope — not path substrings.
	const reverseScoped =
		Boolean((marker as any).reverseScoped) ||
		Boolean((marker as any).requireReverseProof) ||
		/proof_exit|bind_ready|runtime_capture|reverse_domain|domain_proof_exit/i.test(markerBlob);
	const reverseProofPresent =
		/proof[._]?exit\s*[=:]\s*(?:partial_runtime_capture|runtime_capture_strong)|bind_ready\s*[=:]\s*true|runtime_capture_strong|partial_runtime_capture/i.test(
			markerBlob,
		);
	if (
		reverseScoped &&
		!reverseProofPresent &&
		!requiredGaps.some((g: any) => /proof_exit|bind_ready|reverse/i.test(String(g)))
	) {
		requiredGaps.push("reverse_proof_exit_or_bind_ready_missing");
	}
	const platformRequiredScore = marker.platformRequiredScore ?? marker.checks?.checkAndScores?.platformRequiredScore;
	const orchestrationScore = marker.orchestrationScore ?? marker.checks?.checkAndScores?.orchestrationScore;
	const status: StrictClaimCheckSnapshot["status"] =
		marker.kind === "repi-claim-release-marker" &&
		marker.mode === "strict-claims" &&
		marker.ok === true &&
		requiredGaps.length === 0
			? "pass"
			: "blocked";
	const claimCheckResult = [
		`strict_claim_check.status=${status}`,
		`strict_claim_check.marker_path=${markerPath}`,
		`strict_claim_check.generated_at=${marker.generatedAt ?? "missing"}`,
		`strict_claim_check.mode=${marker.mode ?? "missing"}`,
		`strict_claim_check.ok=${marker.ok === true ? "true" : "false"}`,
		`strict_claim_check.platform_required_score=${platformRequiredScore ?? "missing"}`,
		`strict_claim_check.orchestration_score=${orchestrationScore ?? "missing"}`,
		`strict_claim_check.required_gaps=${requiredGaps.length}`,
		`strict_claim_check.final_publish_ready=${status === "pass" ? "yes" : "no"}`,
		...(requiredGaps.length
			? requiredGaps.slice(0, 12).map((gap: any) => `strict_claim_check.required_gap=${gap}`)
			: []),
	];
	return {
		status,
		markerPath,
		generatedAt: marker.generatedAt,
		mode: marker.mode,
		requiredGaps,
		platformRequiredScore,
		orchestrationScore,
		claimCheckResult,
	};
}
