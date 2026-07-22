/** REPI wire bus slice: wire-decision-modules.ts. */

import { wireAutonomousBudgetConfigure } from "./wire-decision-budget.ts";
import { wireStructuredClaimConfigure } from "./wire-decision-claim.ts";
import { wireFailureRepairConfigure } from "./wire-decision-failure.ts";
import { wirePoisonSanitizeConfigure } from "./wire-decision-poison.ts";
import { wireDecisionRuntimeConfigure } from "./wire-decision-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireDecisionModules(pick: PickFn): void {
	wireDecisionRuntimeConfigure(pick);
	wireAutonomousBudgetConfigure(pick);
	wireStructuredClaimConfigure(pick);
	wireFailureRepairConfigure(pick);
	wirePoisonSanitizeConfigure(pick);
}
