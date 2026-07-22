/** Proof-loop quick plan from gap items (reverse-aware). */

import { finalizeRepiProofLoopQuickPlan } from "./plan-quick-plan-finalize.ts";
import { buildRepiProofLoopQuickPlanPhases } from "./plan-quick-plan-phases.ts";
import type { RepiProofLoopGapItem, RepiProofLoopQuickPlanV1 } from "./types.ts";

export function repiProofLoopQuickPlanFromItems(
	items: RepiProofLoopGapItem[],
	target?: string,
): RepiProofLoopQuickPlanV1 {
	const bag = buildRepiProofLoopQuickPlanPhases(items, target);
	return finalizeRepiProofLoopQuickPlan(bag);
}
