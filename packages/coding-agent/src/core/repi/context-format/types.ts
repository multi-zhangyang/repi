/** Context pack format view types. */
import type { AutonomousExecutionBudget } from "../operator-format-types.ts";
import type {
	ContextPackCompactResumeLedgerView,
	ContextPackMemoryActiveKernelView,
	ContextPackMemoryDepositionView,
	ContextPackMemoryExperienceView,
	ContextPackMemoryMaturationView,
	ContextPackMemoryOrchestratorView,
	ContextPackMemoryQualityView,
	ContextPackMemoryReplayView,
	ContextPackMemoryStrategyView,
} from "./types-memory.ts";

export type {
	ContextPackCompactResumeLedgerView,
	ContextPackMemoryActiveKernelView,
	ContextPackMemoryDepositionView,
	ContextPackMemoryExperienceView,
	ContextPackMemoryMaturationView,
	ContextPackMemoryOrchestratorView,
	ContextPackMemoryQualityView,
	ContextPackMemoryReplayView,
	ContextPackMemoryStrategyView,
} from "./types-memory.ts";

export type ContextPackFormatView = {
	timestamp: string;
	mode: string;
	missionId?: string;
	route?: string;
	target?: string;
	contractId?: string;
	schemaVersion?: number | string;
	contextPath?: string;
	contextSha256?: string;
	resumedFromContextPath?: string;
	resumeQueueStatus?: string;
	idempotencyKey?: string;
	activeLane?: string;
	closure?: { status?: string; closedAt?: string | null; reason?: string; verifiedBy?: string };
	exactResumeVerification?: {
		loadedBy?: string;
		sourcePath?: string;
		contextSha256?: string;
		artifactHashes?: string | number;
		scope?: string;
		blocked: string[];
		warnings: string[];
	};
	resumeBrief: string[];
	checkSummary: string[];
	artifactIndex: Array<{
		kind: string;
		path: string;
		exists?: boolean | string;
		sha256?: string | null;
		scopeVerdict?: string;
		[key: string]: unknown;
	}>;
	artifactScopeFilter?: {
		ArtifactScopeFilterV1?: boolean;
		latest_artifact_side_channel_scope_filter?: boolean;
		checkedArtifactCount?: number;
		blockedArtifactCount?: number;
		warnArtifactCount?: number;
		reportPath?: string;
		quarantinedArtifacts: string[];
		[key: string]: unknown;
	};
	memoryOrchestrator?: ContextPackMemoryOrchestratorView;
	memoryQuality?: ContextPackMemoryQualityView;
	memoryReplay?: ContextPackMemoryReplayView;
	memoryStrategy?: ContextPackMemoryStrategyView;
	memoryActiveKernel?: ContextPackMemoryActiveKernelView;
	memoryMaturation?: ContextPackMemoryMaturationView;
	memoryDeposition?: ContextPackMemoryDepositionView;
	memoryExperience?: ContextPackMemoryExperienceView;
	compactResumeLedgerV2?: ContextPackCompactResumeLedgerView;
	repairQueue: string[];
	commanderMergeBudget?: string[];
	workerScoreboard?: string[];
	swarmRetryQueue?: string[];
	autonomousBudget?: AutonomousExecutionBudget;
	dispatcherScoreDecay?: string[];
	repeatedFailureDemotions?: string[];
	highScorePromotions?: string[];
	reflectionReuseRules: string[];
	nextCommands: string[];
	sourceArtifacts: string[];
	[key: string]: unknown;
};
