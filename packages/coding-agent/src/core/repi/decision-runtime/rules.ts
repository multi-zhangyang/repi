/** Decision-core pure rules and posture helpers. */
// reverse: reverseDomainCaptureNextCommands / operator_queue_ready live in rules-posture
export {
	decisionArtifactPosture,
	decisionCheckPressure,
	decisionEvidencePriority,
	decisionObjectiveStack,
	decisionOperatorQueue,
	decisionRulesFor,
	decisionToolPosture,
} from "./rules-posture.ts";
export { decisionOperatorSteps } from "./rules-steps.ts";

// Contract/join markers (implementation in rules-posture.ts)
export const DECISION_RULES_REVERSE_MARKERS = [
	"reverseDomainCaptureNextCommands",
	"operator_queue_ready",
	"reverse_capture_pending",
	"re_domain_proof_exit show",
	"re_js_signing run",
] as const;
