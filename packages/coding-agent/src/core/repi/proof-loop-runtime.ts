/**
 * Proof-loop plan/run/write/show surface.
 * Implementation under ./proof-loop-runtime/*.
 */

export {
	buildProofLoop,
	buildProofLoopOutput,
	latestProofLoopArtifactPath,
	refreshProofLoopCached,
	runProofLoop,
	writeProofLoopArtifact,
} from "./proof-loop-runtime/build.ts";
export { configureProofLoop, d } from "./proof-loop-runtime/deps.ts";
export {
	caseMemoryLanePlanLines,
	formatProofLoop,
	formatProofLoopRuntimeAdapterClosureRow,
} from "./proof-loop-runtime/format.ts";
export type {
	CaseMemoryLanePlan,
	ProofLoopArtifact,
	ProofLoopDeps,
	ProofLoopPhase,
	ProofLoopRuntimeAdapterClosureRow,
	ProofLoopStatus,
	ProofLoopStep,
	ProofLoopVerdict,
} from "./proof-loop-runtime/types.ts";
