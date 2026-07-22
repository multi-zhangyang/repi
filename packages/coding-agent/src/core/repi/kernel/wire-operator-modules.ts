/** REPI wire bus slice: wire-operator-modules.ts. */

import { wireOperatorAutopilotModules } from "./wire-operator-autopilot.ts";
import { wireOperatorStepModules } from "./wire-operator-steps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireOperatorModules(pick: PickFn): void {
	wireOperatorStepModules(pick);
	wireOperatorAutopilotModules(pick);
}
