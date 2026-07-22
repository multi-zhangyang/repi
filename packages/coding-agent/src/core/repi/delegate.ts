/**
 * Specialist delegation packets and worker contracts.
 * Implementation under ./delegate/*.
 */

export {
	buildDelegate,
	buildDelegateOutput,
	latestDelegateArtifactPath,
	latestOrBuildDelegate,
	latestOrBuildOperation,
	parseDelegateArtifact,
	writeDelegateArtifact,
} from "./delegate/build.ts";
export {
	configureDelegate,
	d,
} from "./delegate/deps.ts";
export {
	adaptiveToolsForWorker,
	buildWorkerPromotionQueue,
	delegateEvidenceContract,
	delegateObjective,
	delegateTools,
	delegateWorkerForStep,
	dispatcherPromotionQueue,
	isDelegateWorker,
	latestWorkerScoreboard,
} from "./delegate/pure.ts";
export type {
	DelegateArtifact,
	DelegateDeps,
	DelegatePacket,
	DelegateWorker,
	DelegateWorkerScoreboardEntry,
} from "./delegate/types.ts";
