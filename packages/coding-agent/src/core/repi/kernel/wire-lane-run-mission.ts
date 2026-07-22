/** Wire-lane: configureLaneRunMission bag. */

import { configureLaneRunMission } from "../lane-run-mission.ts";
import { writeCurrentMission } from "../mission/io.ts";
import { toolIndexPath } from "../storage/paths/core.ts";
import { metadataValue } from "../text.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireLaneRunMissionConfigure(pick: PickFn): void {
	configureLaneRunMission({
		writeCurrentMission: pick("writeCurrentMission", writeCurrentMission),
		toolIndexPath: pick("toolIndexPath", toolIndexPath),
		metadataValue: pick("metadataValue", metadataValue),
	});
}
