/** Proof-loop gap classifier. */
/** Proof-loop gap items/classifier with reverse proof.exit gaps. */

import { formatRepiProofLoopGapClassifier as formatProofLoopGapClassifier } from "../../proof-loop.ts";
import { proofLoopGapItems } from "./items-core.ts";

export function proofLoopGapClassifier(target?: string): string[] {
	return formatProofLoopGapClassifier(proofLoopGapItems(target));
}
