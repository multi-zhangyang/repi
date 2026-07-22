/**
 * Auto-lane run chain, decision parsing, and command packs.
 * Implementation under ./auto-lane/*.
 */

export {
	autoCommandsForLane,
	autoLaneCommandPack,
	autoModeDefaults,
	laneExecutionStrategy,
	parseAutoLaneCommand,
	removeLaneNextItems,
} from "./auto-lane/commands.ts";
export {
	formatRunAutoDecision,
	parseLaneRunDecision,
	parsePlannerDecision,
	shouldEscalateAdaptiveDecision,
} from "./auto-lane/decision.ts";
export { configureAutoLane, d } from "./auto-lane/deps.ts";
export { runAutoLaneChain } from "./auto-lane/run.ts";
export type { AutoLaneDeps, RunAutoDecision } from "./auto-lane/types.ts";
