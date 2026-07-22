/**
 * Autonomous budget ledger and dispatcher promotion playbook writers.
 * Implementation under ./autonomous-budget/*.
 */

export {
	autonomousLaneDemotionRows,
	cumulativeDispatcherScoreDecayRows,
	dispatcherScoreDecayRows,
	highScorePromotionRows,
	historicalCategoryCount,
	latestAutonomousBudgetLedger,
	repeatedFailureDemotionRows,
	workerScoreDemotionRows,
} from "./autonomous-budget/demotions.ts";
export { configureAutonomousBudget, d } from "./autonomous-budget/deps.ts";
export type {
	AutonomousBudgetDeps,
	AutonomousBudgetLedgerSnapshot,
} from "./autonomous-budget/types.ts";
export {
	applyAutonomousBudgetDemotions,
	writeAutonomousBudgetLedger,
	writeDispatcherPromotionPlaybook,
	writeFormalDispatcherPromotionPlaybook,
} from "./autonomous-budget/write.ts";
