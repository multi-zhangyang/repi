/** Proof-loop case-memory format lines. */

import { truncateMiddle } from "../text.ts";
import type { CaseMemoryLanePlan } from "./types.ts";

export function caseMemoryLanePlanLines(plan?: CaseMemoryLanePlan): string[] {
	if (!plan) return ["case_memory_lane_plan: none"];
	return [
		`case_memory_lane_plan: action=${plan.action} reason=${plan.reason}`,
		plan.targetLane ? `case_memory_target_lane=${plan.targetLane}` : undefined,
		plan.addedLane ? `case_memory_added_lane=${plan.addedLane}` : undefined,
		plan.skippedLane ? `case_memory_skipped_lane=${plan.skippedLane}` : undefined,
		`case_memory_migrations=${plan.migrations?.length ?? 0}`,
		...(plan.migrations ?? []).slice(0, 6).map((item: any) => `case_memory_migration=${truncateMiddle(item, 220)}`),
	].filter((item): item is string => Boolean(item));
}
