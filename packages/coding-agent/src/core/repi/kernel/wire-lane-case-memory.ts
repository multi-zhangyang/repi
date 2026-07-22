/** Wire-lane: configureCaseMemory bag. */

import { configureCaseMemory } from "../case-memory.ts";
import { findLaneIndex } from "../lane-run-mission/helpers.ts";
import { caseMemoryLanePlan, memoryPath } from "../memory-stubs.ts";
import { upsertMissionCheckpoint, writeCurrentMission } from "../mission/io.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireCaseMemoryConfigure(pick: PickFn): void {
	configureCaseMemory({
		writeCurrentMission: pick("writeCurrentMission", writeCurrentMission),
		upsertMissionCheckpoint: pick("upsertMissionCheckpoint", upsertMissionCheckpoint),
		findLaneIndex: pick("findLaneIndex", findLaneIndex),
		caseMemoryLanePlan: pick("caseMemoryLanePlan", caseMemoryLanePlan),
		memoryPath: pick("memoryPath", memoryPath),
	});
}
