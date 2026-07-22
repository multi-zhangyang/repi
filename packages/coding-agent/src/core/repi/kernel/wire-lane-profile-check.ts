/** Wire-lane: configureProfileCheck bag. */

import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { appendEvidence } from "../evidence.ts";
import { configureProfileCheck } from "../profile-check.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProfileCheckConfigure(pick: PickFn): void {
	configureProfileCheck({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
