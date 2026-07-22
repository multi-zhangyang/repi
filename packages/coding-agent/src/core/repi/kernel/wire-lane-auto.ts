/** Wire-lane: configureAutoLane bag. */

import { autoCommandsForLane, autoLaneCommandPack, removeLaneNextItems } from "../auto-lane/commands.ts";
import { formatRunAutoDecision, parseLaneRunDecision, shouldEscalateAdaptiveDecision } from "../auto-lane/decision.ts";
import { configureAutoLane } from "../auto-lane.ts";
import { writeRunAutoPlaybook } from "../autopilot.ts";
import { formatCaseMemoryLanePlan } from "../case-memory.ts";
import { laneCommandPack } from "../lane-commands/pack-core.ts";
import { runLaneCommandPack } from "../lane-commands/run.ts";
import { applyAdaptiveMultiLanePlan, formatMultiLanePlan } from "../lane-run-mission/apply-adaptive.ts";
import { applyCaseMemoryLanePlan } from "../memory-stubs.ts";
import { readCurrentMission } from "../mission/io.ts";
import { activeLane } from "../mission/lane-helpers.ts";
import { runToolBootstrapClosure } from "../tool-bootstrap.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireAutoLaneConfigure(pick: PickFn): void {
	configureAutoLane({
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		activeLane: pick("activeLane", activeLane),
		laneCommandPack: pick("laneCommandPack", laneCommandPack),
		applyCaseMemoryLanePlan: pick("applyCaseMemoryLanePlan", applyCaseMemoryLanePlan),
		formatCaseMemoryLanePlan: pick("formatCaseMemoryLanePlan", formatCaseMemoryLanePlan),
		autoLaneCommandPack: pick("autoLaneCommandPack", autoLaneCommandPack),
		autoCommandsForLane: pick("autoCommandsForLane", autoCommandsForLane),
		runLaneCommandPack: pick("runLaneCommandPack", runLaneCommandPack),
		runToolBootstrapClosure: pick("runToolBootstrapClosure", runToolBootstrapClosure),
		removeLaneNextItems: pick("removeLaneNextItems", removeLaneNextItems),
		writeRunAutoPlaybook: pick("writeRunAutoPlaybook", writeRunAutoPlaybook),
		parseLaneRunDecision: pick("parseLaneRunDecision", parseLaneRunDecision),
		shouldEscalateAdaptiveDecision: pick("shouldEscalateAdaptiveDecision", shouldEscalateAdaptiveDecision),
		applyAdaptiveMultiLanePlan: pick("applyAdaptiveMultiLanePlan", applyAdaptiveMultiLanePlan),
		formatMultiLanePlan: pick("formatMultiLanePlan", formatMultiLanePlan),
		formatRunAutoDecision: pick("formatRunAutoDecision", formatRunAutoDecision),
	});
}
