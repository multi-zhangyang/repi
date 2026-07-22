/** Wire-decision: configureFailureRepair bag. */

import { operatorFeedbackFallbackCommands, runtimeArtifactHashes } from "../failure-repair/classify-deps.ts";
import { configureFailureRepair } from "../failure-repair.ts";
import { latestProofLoopArtifactPath } from "../memory-events-deps.ts";
import { operatorFeedbackCategory } from "../operator-runtime/feedback-category.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireFailureRepairConfigure(pick: PickFn): void {
	configureFailureRepair({
		latestProofLoopArtifactPath: pick("latestProofLoopArtifactPath", latestProofLoopArtifactPath),
		operatorFeedbackCategory: pick("operatorFeedbackCategory", operatorFeedbackCategory),
		operatorFeedbackFallbackCommands: pick("operatorFeedbackFallbackCommands", operatorFeedbackFallbackCommands),
		runtimeArtifactHashes: pick("runtimeArtifactHashes", runtimeArtifactHashes),
	});
}
