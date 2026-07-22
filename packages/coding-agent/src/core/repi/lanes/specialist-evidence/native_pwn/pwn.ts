/** Specialist evidence analyzer: pwn. */
import type { LaneCommandPack } from "../../../lane-commands/types.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
import { extractPwnPrimitiveFindings } from "./pwn-findings.ts";
import { appendPwnPrimitiveFollowups } from "./pwn-followups.ts";

export function analyzePwnPrimitiveEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const meta = extractPwnPrimitiveFindings(pack, combined, targetArg);
	if (!meta.enabled) return { findings: [], followups: [] };
	const { followups, nextLane } = appendPwnPrimitiveFollowups(meta);
	return {
		findings: meta.findings,
		followups,
		nextLane,
	};
}

export { extractPwnPrimitiveFindings } from "./pwn-findings.ts";
export { appendPwnPrimitiveFollowups } from "./pwn-followups.ts";
