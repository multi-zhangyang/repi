/** Collect proof-loop gap items from verifier/compiler/replay/autofix/graph/feedback. */
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { collectProofLoopArtifactGaps } from "./items-core-collect-artifacts.ts";
import { createProofLoopGapCollector } from "./items-core-collect-helpers.ts";
import { collectProofLoopRuntimeGaps } from "./items-core-collect-runtime.ts";

export function collectProofLoopGapItemsRaw(target?: string): Array<Omit<ProofLoopGapItem, "worker">> {
	const collector = createProofLoopGapCollector(target);
	collectProofLoopArtifactGaps(collector);
	collectProofLoopRuntimeGaps(collector);
	return collector.items;
}
