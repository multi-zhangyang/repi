/** Specialist evidence lane-run analysis orchestration. */
import type { LaneCommandPack } from "../self-heal.ts";
import { analyzeLaneRunBase } from "./analyze-base.ts";
import { finalizeLaneRunAnalysis } from "./analyze-reverse.ts";
import { applySpecialistEvidenceAnalyzers } from "./analyze-specialists.ts";
import type { LaneRunAnalysis } from "./types.ts";

export function analyzeLaneRun(
	pack: LaneCommandPack,
	result: { code: number; stdout: string; stderr: string; killed?: boolean },
): LaneRunAnalysis {
	const base = analyzeLaneRunBase(pack, result);
	const nextLane = applySpecialistEvidenceAnalyzers(
		base.pack,
		base.combined,
		base.targetArg,
		base.lowerLane,
		base.findings,
		base.followups,
		base.result,
	);
	return finalizeLaneRunAnalysis({
		pack: base.pack,
		result: base.result,
		findings: base.findings,
		followups: base.followups,
		nextLane,
	});
}
