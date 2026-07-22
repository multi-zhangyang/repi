/** Autonomous budget lines for operator format. */
/** Operator/delegate pure format helpers. */

import type { AutonomousExecutionBudget } from "./operator-format-types.ts";
import { EMPTY_AUTONOMOUS_BUDGET } from "./operator-format-types.ts";

export function autonomousBudgetLines(budget: AutonomousExecutionBudget | undefined): string[] {
	const current = budget ?? EMPTY_AUTONOMOUS_BUDGET;
	return [
		`max_turns=${current.maxTurns}`,
		`max_dispatch=${current.maxDispatch}`,
		`max_proof_loops=${current.maxProofLoops}`,
		`max_worker_retries=${current.maxWorkerRetries}`,
		`dispatcher_board=${current.dispatcherBoardPath ?? "none"}`,
		`promotion_playbook=${current.promotionPlaybookPath ?? "none"}`,
		`ledger=${current.ledgerPath ?? "none"}`,
		`formal_playbook=${current.formalPlaybookPath ?? "none"}`,
		`score_decay=${current.scoreDecay.length}`,
		`historical_score_decay=${current.historicalScoreDecay.length}`,
		`demotions=${current.demotionRules.length}`,
		`lane_demotions=${current.laneDemotions.length}`,
		`worker_demotions=${current.workerDemotions.length}`,
		`dispatcher_demotions=${current.dispatcherDemotions.length}`,
		`promotions=${current.promotionRules.length}`,
		`playbook_promotions=${current.playbookPromotions.length}`,
		`ledger_rows=${current.ledgerRows.length}`,
		...(current.nextActions.length ? current.nextActions.map((item: any) => `next=${item}`) : ["next=none"]),
	];
}
