/** Wire-lane: configureLaneCommands bag. */

import { laneExecutionStrategy } from "../auto-lane/commands.ts";
import { formatAutopilotExecutionStrategy } from "../autopilot-strategy.ts";
import { configureLaneCommands } from "../lane-commands/deps.ts";
import { appendLaneRunMemoryEvent, appendMemoryReuseFeedback } from "../lane-memory.ts";
import { applyLaneRunMissionUpdate } from "../lane-run-mission/apply.ts";
import { analyzeLaneRun } from "../lanes/specialist-evidence/analyze.ts";
import { formatLaneRunAnalysis } from "../lanes/specialist-evidence/quality.ts";
import { inferTargetFromMap, latestPassiveMapContext } from "../passive-map-runtime.ts";
import { memoryCommandCandidates } from "../playbooks-candidates.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireLaneCommandsConfigure(pick: PickFn): void {
	configureLaneCommands({
		latestPassiveMapContext: pick("latestPassiveMapContext", latestPassiveMapContext),
		inferTargetFromMap: pick("inferTargetFromMap", inferTargetFromMap),
		memoryCommandCandidates: pick("memoryCommandCandidates", memoryCommandCandidates),
		laneExecutionStrategy: pick("laneExecutionStrategy", laneExecutionStrategy),
		formatAutopilotExecutionStrategy: pick("formatAutopilotExecutionStrategy", formatAutopilotExecutionStrategy),
		analyzeLaneRun: pick("analyzeLaneRun", analyzeLaneRun),
		formatLaneRunAnalysis: pick("formatLaneRunAnalysis", formatLaneRunAnalysis),
		appendEvidence: pick("appendEvidence", appendEvidence),
		appendLaneRunMemoryEvent: pick("appendLaneRunMemoryEvent", appendLaneRunMemoryEvent),
		appendMemoryReuseFeedback: pick("appendMemoryReuseFeedback", appendMemoryReuseFeedback),
		applyLaneRunMissionUpdate: pick("applyLaneRunMissionUpdate", applyLaneRunMissionUpdate),
	});
}
