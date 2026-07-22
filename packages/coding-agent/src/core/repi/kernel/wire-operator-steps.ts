/** Wire-operator: operator/operation step configure bag. */
/** REPI wire bus slice: wire-operator-modules.ts. */

import { wireOperatorStepOperationModules } from "./wire-operator-steps-operation-step.ts";
import { wireOperatorStepRuntimeModules } from "./wire-operator-steps-operator-runtime.ts";
import { wireOperatorStepOperatorModules } from "./wire-operator-steps-operator-step.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireOperatorStepModules(pick: PickFn): void {
	wireOperatorStepOperatorModules(pick);
	wireOperatorStepRuntimeModules(pick);
	wireOperatorStepOperationModules(pick);
}
