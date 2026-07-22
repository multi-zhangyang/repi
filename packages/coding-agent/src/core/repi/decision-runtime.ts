/**
 * Decision-core plan/write/show/run surface.
 * Implementation under ./decision-runtime/*.
 */

export {
	buildDecisionCore,
	buildDecisionCoreOutput,
	formatDecisionCore,
	latestDecisionCoreArtifactPath,
	runDecisionCore,
	writeDecisionCoreArtifact,
} from "./decision-runtime/build.ts";
export { configureDecisionRuntime, d } from "./decision-runtime/deps.ts";
export {
	decisionArtifactPosture,
	decisionCheckPressure,
	decisionEvidencePriority,
	decisionObjectiveStack,
	decisionOperatorQueue,
	decisionOperatorSteps,
	decisionRulesFor,
	decisionToolPosture,
} from "./decision-runtime/rules.ts";
export type {
	DecisionCoreArtifact,
	DecisionRuntimeDeps,
} from "./decision-runtime/types.ts";
