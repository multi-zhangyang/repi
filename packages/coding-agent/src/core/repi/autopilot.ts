/**
 * Autopilot mission bootstrap and lane chain runner.
 * Implementation under ./autopilot/*.
 */

export {
	ensureAutopilotMission,
	prepareAutopilotCleanState,
} from "./autopilot/mission.ts";
export { writeRunAutoPlaybook } from "./autopilot/playbook.ts";
export { runAutopilot } from "./autopilot/run.ts";
export type { AutopilotDeps } from "./autopilot-deps.ts";
export {
	appendEvolution,
	appendJournal,
	configureAutopilot,
	createBootstrapPlan,
	d,
	fallbackForMissingTools,
	formatBootstrapPlan,
	formatMission,
	missingToolsForCommand,
	parseToolIndex,
	recommendedToolsForRoute,
	uniqueMatches,
	updateMissionCheckpoint,
} from "./autopilot-deps.ts";
export {
	autopilotBootstrapPlan,
	autopilotExecutionStrategy,
	formatAutopilotBootstrap,
	formatAutopilotExecutionStrategy,
} from "./autopilot-strategy.ts";
