export { commanderBudgetValue, isCommanderRuntimeCommand } from "./budget-helpers.ts";

import { dispatcherFeedbackParsedRows } from "../../autonomous-budget/deps.ts";
import { latestDispatcherFeedbackBoard } from "../../knowledge-graph/deps.ts";
import { memoryPath } from "../../memory-stubs.ts";
import type { AutonomousExecutionBudget } from "../../operator-format-types.ts";
import {
	autonomousLaneDemotionRows,
	commandTargetSuffix,
	cumulativeDispatcherScoreDecayRows,
	dispatcherScoreDecayRows,
	highScorePromotionRows,
	latestAutonomousBudgetLedger,
	repeatedFailureDemotionRows,
	workerScoreDemotionRows,
} from "../deps.ts";
import { autonomousBudgetNextActions } from "./budget-next.ts";
export function autonomousExecutionBudget(target?: string, rows?: string[]): AutonomousExecutionBudget {
	const board = latestDispatcherFeedbackBoard();
	const ledger = latestAutonomousBudgetLedger();
	const scoreboardRows = rows ?? board.lines;
	const immediateScoreDecay = dispatcherScoreDecayRows(scoreboardRows);
	const historicalScoreDecay = cumulativeDispatcherScoreDecayRows(scoreboardRows, ledger);
	const dispatcherDemotions = repeatedFailureDemotionRows(scoreboardRows, target);
	const workerDemotions = workerScoreDemotionRows(target, ledger);
	const laneDemotions = autonomousLaneDemotionRows({ dispatcherDemotions, workerDemotions, ledger, target });
	const playbookPromotions = highScorePromotionRows(scoreboardRows, target);
	const scoreDecay: string[] = Array.from(new Set([...immediateScoreDecay, ...historicalScoreDecay])).slice(
		0,
		40,
	) as string[];
	const demotionRules: string[] = Array.from(
		new Set([...dispatcherDemotions, ...workerDemotions, ...laneDemotions]),
	).slice(0, 40) as string[];
	const promotionRules: string[] = Array.from(new Set(playbookPromotions)).slice(0, 32) as string[];
	const queuedPressure = dispatcherFeedbackParsedRows(scoreboardRows).filter(
		(row: any) => row.status === "queued",
	).length;
	const historicalFailurePressure = Math.min(
		4,
		ledger.demotions.length + historicalScoreDecay.filter((row: any) => /demote_dispatcher/i.test(row)).length,
	);
	const failurePressure = demotionRules.length + historicalFailurePressure;
	const promotionPressure = promotionRules.length + Math.min(3, ledger.promotions.length);
	const maxTurns = Math.max(3, Math.min(9, 5 + Math.min(2, promotionPressure) - Math.min(3, failurePressure)));
	const maxDispatch = Math.max(
		1,
		Math.min(6, 2 + Math.min(2, promotionPressure) - Math.min(3, queuedPressure + failurePressure)),
	);
	const maxProofLoops = Math.max(1, Math.min(5, 2 + (promotionPressure > 0 ? 1 : 0) - (failurePressure > 3 ? 1 : 0)));
	const maxWorkerRetries = Math.max(1, Math.min(4, 2 + (failurePressure > 0 ? 1 : 0)));
	const suffix = commandTargetSuffix(target);
	const nextActions: string[] = autonomousBudgetNextActions({
		target,
		suffix,
		laneDemotions: laneDemotions as string[],
		demotionRules: demotionRules as string[],
		promotionRules: promotionRules as string[],
		maxDispatch,
		maxProofLoops,
	});
	return {
		maxTurns,
		maxDispatch,
		maxProofLoops,
		maxWorkerRetries,
		dispatcherBoardPath: board.path,
		promotionPlaybookPath: memoryPath("dispatcher-promotion-playbook.md"),
		ledgerPath: ledger.path,
		scoreDecay: scoreDecay as string[],
		historicalScoreDecay: historicalScoreDecay as string[],
		demotionRules: demotionRules as string[],
		laneDemotions: laneDemotions as string[],
		workerDemotions: workerDemotions as string[],
		dispatcherDemotions: dispatcherDemotions as string[],
		promotionRules: promotionRules as string[],
		playbookPromotions: playbookPromotions as string[],
		ledgerRows: ledger.rows.slice(0, 40),
		nextActions: nextActions as string[],
	};
}
