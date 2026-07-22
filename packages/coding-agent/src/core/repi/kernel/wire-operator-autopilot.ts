/** Wire-operator: autopilot + compact-resume configure bag. */
/** REPI wire bus slice: wire-operator-modules.ts. */

import { wireAutopilotConfigure } from "./wire-operator-autopilot-configure.ts";
import { wireCompactResumeConfigure } from "./wire-operator-compact-resume.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireOperatorAutopilotModules(pick: PickFn): void {
	wireAutopilotConfigure(pick);
	wireCompactResumeConfigure(pick);
}
