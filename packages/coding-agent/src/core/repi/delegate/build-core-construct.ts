/** Build delegate artifact. */
// Landmark: reverseDomainCaptureNextCommands includeGates buildDelegate reverse next
import { ensureReconStorage } from "../resources.ts";
import { buildDelegateArtifactFields } from "./build-core-construct-fields.ts";
import { delegateReverseNextActions } from "./build-core-construct-reverse.ts";
import { buildDelegatePackets } from "./build-core-packets.ts";
import { latestOrBuildOperation } from "./build-output.ts";
import { autonomousExecutionBudget, dispatcherAdaptiveRoutingHints, workerAdaptiveRoutingHints } from "./deps.ts";
import { buildWorkerPromotionQueue, dispatcherPromotionQueue, latestWorkerScoreboard } from "./pure.ts";
import type { DelegateArtifact } from "./types.ts";

export function buildDelegate(
	options: { target?: string; task?: string; mode?: "plan" | "merge" } = {},
): DelegateArtifact {
	ensureReconStorage();
	const { operation, path: operationArtifact } = latestOrBuildOperation(options);
	const scoreboard = latestWorkerScoreboard();
	const target = operation.target ?? options.target;
	const autonomousBudget = autonomousExecutionBudget(target);
	const adaptiveRoutingHints = Array.from(
		new Set([
			...workerAdaptiveRoutingHints(scoreboard.entries, target),
			...dispatcherAdaptiveRoutingHints(target),
			...autonomousBudget.scoreDecay.slice(0, 8),
		]),
	).slice(0, 32);
	const workerPromotionQueue = Array.from(
		new Set([
			...buildWorkerPromotionQueue(scoreboard.entries, target),
			...dispatcherPromotionQueue(target),
			...autonomousBudget.promotionRules,
		]),
	).slice(0, 24);
	const packets = buildDelegatePackets({
		operation,
		target,
		scoreboard,
		adaptiveRoutingHints,
		workerPromotionQueue,
	});
	const fields = buildDelegateArtifactFields({
		operation,
		target,
		packets,
		adaptiveRoutingHints,
		workerPromotionQueue,
		autonomousBudget,
	});
	const nextActions = delegateReverseNextActions({
		target,
		task: options.task,
		mode: options.mode,
		gaps: fields.gaps,
		nextActions: fields.nextActions,
	});
	return {
		timestamp: new Date().toISOString(),
		missionId: operation.missionId,
		route: operation.route,
		target,
		mode: options.mode ?? "plan",
		operationArtifact,
		packets,
		mergeQueue: fields.mergeQueue,
		specialistCoverage: fields.specialistCoverage,
		workerScoreboard: scoreboard.lines.slice(0, 32),
		adaptiveRoutingHints,
		workerPromotionQueue,
		autonomousBudget,
		dispatcherScoreDecay: autonomousBudget.scoreDecay,
		repeatedFailureDemotions: autonomousBudget.demotionRules,
		highScorePromotions: autonomousBudget.promotionRules,
		gaps: fields.gaps,
		nextActions,
		sourceArtifacts: Array.from(
			new Set([operationArtifact, scoreboard.path, ...operation.sourceArtifacts].filter(Boolean) as string[]),
		).slice(0, 32),
	};
}
