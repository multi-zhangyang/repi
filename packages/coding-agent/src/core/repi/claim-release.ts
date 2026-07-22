/**
 * Claim-release markers and strict claim check snapshot for REPI final publish gate.
 */

export {
	configureClaimRelease,
	latestClaimReleaseMarkerPath,
	parseClaimReleaseMarker,
	writeLocalClaimReleaseMarker,
} from "./claim-release/io.ts";
export { buildClaimCheckResult } from "./claim-release/result.ts";
export { claimReleaseGapLabel, strictClaimCheckSnapshot } from "./claim-release/strict.ts";
export type { ClaimReleaseGap, ClaimReleaseMarker, StrictClaimCheckSnapshot } from "./runtime-types.ts";
