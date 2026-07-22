/** Wire autopilot configure bag. */

import { configureAutopilot } from "../autopilot.ts";
import { appendEvolution, appendJournal } from "../journal.ts";
import { formatMission, updateMissionCheckpoint } from "../mission.ts";
import { uniqueMatches } from "../text.ts";
import {
	createBootstrapPlan,
	fallbackForMissingTools,
	formatBootstrapPlan,
	missingToolsForCommand,
	parseToolIndex,
	recommendedToolsForRoute,
} from "../tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireAutopilotConfigure(pick: PickFn): void {
	configureAutopilot({
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		uniqueMatches: pick("uniqueMatches", uniqueMatches),
		formatMission: pick("formatMission", formatMission),
		appendJournal: pick("appendJournal", appendJournal),
		appendEvolution: pick("appendEvolution", appendEvolution),
		createBootstrapPlan: pick("createBootstrapPlan", createBootstrapPlan),
		fallbackForMissingTools: pick("fallbackForMissingTools", fallbackForMissingTools),
		formatBootstrapPlan: pick("formatBootstrapPlan", formatBootstrapPlan),
		missingToolsForCommand: pick("missingToolsForCommand", missingToolsForCommand),
		parseToolIndex: pick("parseToolIndex", parseToolIndex),
		recommendedToolsForRoute: pick("recommendedToolsForRoute", recommendedToolsForRoute),
	});
}
