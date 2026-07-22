/** Context-pack final object assembly. */

import { buildContextPackArtifactObject } from "./pack-assembly-finalize-object.ts";
import { mergeContextPackReverseNextCommands } from "./pack-assembly-finalize-reverse.ts";
import { collectContextPackFinalizeState } from "./pack-assembly-finalize-state.ts";
import type { ContextPackArtifact } from "./types.ts";

export function finalizeContextPackArtifact(input: any): ContextPackArtifact {
	const {
		mission,
		active,
		route,
		target,
		mode,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		closure,
		compactionLedger,
		resumeBrief,
		nextCommands,
		checkSummary,
		repairQueue,
		commanderMergeBudget,
		workerScoreboard,
		swarmRetryQueue,
		autonomousBudget,
		caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		swarmRetry,
		reflection,
		supervisor,
		formatMission,
		contextPackSha256,
		buildToolDigest,
		formatCompletionAudit,
		memoryOrchestrator,
	} = input;

	const state = collectContextPackFinalizeState(input);
	const mergedNextCommands = mergeContextPackReverseNextCommands(route, target, nextCommands);
	const pack = buildContextPackArtifactObject({
		mission,
		active,
		route,
		target,
		mode,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		closure,
		compactionLedger,
		resumeBrief,
		mergedNextCommands,
		checkSummary,
		repairQueue,
		commanderMergeBudget,
		workerScoreboard,
		swarmRetryQueue,
		autonomousBudget,
		caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		swarmRetry,
		reflection,
		supervisor,
		formatMission,
		buildToolDigest,
		formatCompletionAudit,
		memoryOrchestrator,
		...state,
		compactionResumeTelemetryPath: input.compactionResumeTelemetryPath,
	});
	pack.contextSha256 = contextPackSha256(pack) as string;
	if (pack.resumeContract) pack.resumeContract.contextSha256 = pack.contextSha256 ?? "";
	return pack;
}
