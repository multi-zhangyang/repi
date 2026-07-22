/** Proof-loop quick path + specialist queue. */

import { truncateMiddle } from "../text.ts";
import { repiProofLoopCommandTarget } from "./plan-adapters.ts";
import { repiProofLoopQuickPlanFromItems } from "./plan-quick.ts";
import type { RepiProofLoopGapItem } from "./types.ts";

export function repiProofLoopQuickPathFromItems(items: RepiProofLoopGapItem[], target?: string): string[] {
	return repiProofLoopQuickPlanFromItems(items, target).commands;
}

export function repiProofLoopSpecialistQueueFromItems(items: RepiProofLoopGapItem[], target?: string): string[] {
	const suffix = repiProofLoopCommandTarget(target);
	return items
		.map(
			(item, index) =>
				`proof-gap:${index + 1}:${item.worker} source=${item.source} evidence=${item.sourceArtifacts.slice(0, 3).join(" | ") || "none"} :: ${truncateMiddle(item.text, 520)} -> re_delegate plan${suffix}`,
		)
		.slice(0, 24);
}
