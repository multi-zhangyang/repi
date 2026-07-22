/** Lazy loaders for factory session hooks (compact-resume/context/memory). */

export {
	buildReconCompactionAutoResume,
	buildReconCompactionDetails,
	buildReconCompactionResumeContract,
	buildReconCompactionSummary,
	initialReconCompactionResumeTelemetry,
	reconCompactionAutoResumePrompt,
	writeReconCompactionResumeTelemetry,
} from "./loaders-compact.ts";
export {
	buildContextEvidenceTail,
	buildContextPack,
	buildDecisionCoreOutput,
	buildKernelOutput,
	writeContextPackArtifact,
} from "./loaders-context.ts";
export { _hookDeps } from "./loaders-deps.ts";
export {
	appendMemoryDepositionRuntimeEvent,
	buildPerTurnMemoryRecall,
	repiMemorySettings,
	shouldAutoDepositToolResult,
} from "./loaders-memory.ts";
export { requireRepiModule } from "./loaders-require.ts";
