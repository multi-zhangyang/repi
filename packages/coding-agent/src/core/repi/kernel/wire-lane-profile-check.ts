/** Wire-lane: configureProfileCheck bag. */

import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { configureProfileCheck } from "../profile-check.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProfileCheckConfigure(pick: PickFn): void {
	configureProfileCheck({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
