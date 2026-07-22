/** Wire-decision: configureAutonomousBudget bag. */

import { configureAutonomousBudget } from "../autonomous-budget.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { commandTargetSuffix } from "../context-pack/index.ts";
import { buildWorkerPromotionQueue, latestWorkerScoreboard } from "../delegate/pure.ts";
import { appendEvolution, appendJournal } from "../journal.ts";
import { maintainPlaybooks } from "../memory-stubs.ts";
import { readCurrentMission, writeCurrentMission } from "../mission/io.ts";
import { activeLane } from "../mission/lane-helpers.ts";
import { autonomousBudgetLines } from "../operator-format.ts";
import { autonomousExecutionBudget } from "../operator-runtime/dispatch/budget.ts";
import { dispatcherFeedbackParsedRows } from "../operator-runtime/dispatch/feedback.ts";
import { shellQuote } from "../target.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireAutonomousBudgetConfigure(pick: PickFn): void {
	configureAutonomousBudget({
		activeLane: pick("activeLane", activeLane),
		appendEvolution: pick("appendEvolution", appendEvolution),
		appendJournal: pick("appendJournal", appendJournal),
		autonomousBudgetLines: pick("autonomousBudgetLines", autonomousBudgetLines),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		buildWorkerPromotionQueue: pick("buildWorkerPromotionQueue", buildWorkerPromotionQueue),
		commandTargetSuffix: pick("commandTargetSuffix", commandTargetSuffix),
		dispatcherFeedbackParsedRows: pick("dispatcherFeedbackParsedRows", dispatcherFeedbackParsedRows),
		latestWorkerScoreboard: pick("latestWorkerScoreboard", latestWorkerScoreboard),
		maintainPlaybooks: pick("maintainPlaybooks", maintainPlaybooks),
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		shellQuote: pick("shellQuote", shellQuote),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		writeCurrentMission: pick("writeCurrentMission", writeCurrentMission),
	});
}
