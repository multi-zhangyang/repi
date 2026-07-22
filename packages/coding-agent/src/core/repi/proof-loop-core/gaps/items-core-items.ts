/** Proof-loop gap items with reverse proof.exit gaps. */
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { collectProofLoopGapItemsRaw } from "./items-core-collect.ts";
import { finalizeProofLoopGapItems } from "./items-core-finalize.ts";

export function proofLoopGapItems(target?: string): ProofLoopGapItem[] {
	return finalizeProofLoopGapItems(collectProofLoopGapItemsRaw(target), target);
}
