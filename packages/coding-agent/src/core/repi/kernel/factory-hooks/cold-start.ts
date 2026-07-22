/** Lean/full REPI cold-start system prompt packet. */
import {
	buildRepiColdStartFullPacket,
	buildRepiColdStartLeanPacket,
	type RepiColdStartInput,
} from "./cold-start-packets.ts";

export function buildRepiColdStartPacket(input: {
	route: any;
	mission: { id: string };
	prompt: string;
	stats: any;
	fullColdStart?: boolean;
	formatRoute: (route: any) => string;
	techniqueIdsForRoute: (route: any) => string[];
	buildMissionDigest: () => string;
	buildKernelOutput: (mode: string, opts: any) => string;
	buildDecisionCoreOutput: (mode: string, opts: any) => string;
	buildStartupEvidenceDigest: (opts: any) => string;
	buildStartupContextDigest: (opts: any) => string;
	buildToolDigest: () => string;
	truncateMiddle: (text: string, n: number) => string;
	formatCompletionAudit: () => string;
	makeSelfReview: (stats: any) => string;
}): string {
	const fullColdStart =
		input.fullColdStart ?? (process.env.REPI_COLD_START_FULL === "1" || process.env.REPI_COLD_START_FULL === "true");
	const includeNarrativePacket =
		process.env.REPI_COLD_START_NARRATIVE === "1" || process.env.REPI_COLD_START_NARRATIVE === "true";
	const packetInput: RepiColdStartInput = {
		route: input.route,
		mission: input.mission,
		prompt: input.prompt,
		stats: input.stats,
		formatRoute: input.formatRoute,
		techniqueIdsForRoute: input.techniqueIdsForRoute,
		buildMissionDigest: input.buildMissionDigest,
		buildKernelOutput: input.buildKernelOutput,
		buildDecisionCoreOutput: input.buildDecisionCoreOutput,
		buildStartupEvidenceDigest: input.buildStartupEvidenceDigest,
		buildStartupContextDigest: input.buildStartupContextDigest,
		buildToolDigest: input.buildToolDigest,
		truncateMiddle: input.truncateMiddle,
		formatCompletionAudit: input.formatCompletionAudit,
		makeSelfReview: input.makeSelfReview,
	};
	if (fullColdStart) {
		return buildRepiColdStartFullPacket({ ...packetInput, includeNarrativePacket });
	}
	return buildRepiColdStartLeanPacket(packetInput);
}
