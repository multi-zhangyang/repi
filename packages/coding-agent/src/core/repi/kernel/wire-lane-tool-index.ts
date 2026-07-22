/** Wire-lane: configureToolIndexInstall bag. */

import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { configureToolIndexInstall } from "../tool-index/deps.ts";
import { refreshToolIndex } from "../tool-index/install.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireToolIndexInstallConfigure(pick: PickFn): void {
	configureToolIndexInstall({
		refreshToolIndex: pick("refreshToolIndex", refreshToolIndex),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
