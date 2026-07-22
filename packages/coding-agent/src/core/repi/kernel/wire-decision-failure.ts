/** Wire-decision: configureFailureRepair bag. */

import { configureFailureRepair } from "../failure-repair.ts";
import { operatorFeedbackCategory } from "../operator-runtime/feedback-category.ts";
import { operatorFeedbackFallbackCommands } from "../operator-runtime/feedback-next.ts";
import { latestProofLoopArtifactPath } from "../proof-loop-runtime.ts";
import { runtimeArtifactHashes } from "../swarm-claim-ledger/pure.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireFailureRepairConfigure(pick: PickFn): void {
	configureFailureRepair({
		latestProofLoopArtifactPath: pick("latestProofLoopArtifactPath", latestProofLoopArtifactPath),
		operatorFeedbackCategory: pick("operatorFeedbackCategory", operatorFeedbackCategory),
		operatorFeedbackFallbackCommands: pick("operatorFeedbackFallbackCommands", operatorFeedbackFallbackCommands),
		// Concrete pure impl — never pass classify-deps shim (self re-entry stack overflow).
		runtimeArtifactHashes: pick("runtimeArtifactHashes", runtimeArtifactHashes),
	});
}
