/** Decision-core text formatter. */
import { truncateMiddle } from "../text.ts";
import type { DecisionCoreArtifact } from "./types.ts";

export function formatDecisionCore(decision: DecisionCoreArtifact, path?: string): string {
	return [
		"decision_core:",
		path ? `decision_artifact: ${path}` : undefined,
		`timestamp: ${decision.timestamp}`,
		`mode: ${decision.mode}`,
		`mission_id: ${decision.missionId ?? "none"}`,
		`route: ${decision.route ?? "none"}`,
		`target: ${decision.target ?? "<none>"}`,
		`active_lane: ${decision.activeLane ?? "none"}`,
		"objective_stack:",
		...(decision.objectiveStack.length ? decision.objectiveStack.map((item: any) => `- ${item}`) : ["- none"]),
		"check_pressure:",
		...(decision.checkPressure.length ? decision.checkPressure.map((item: any) => `- ${item}`) : ["- none"]),
		"evidence_priority:",
		...(decision.evidencePriority.length ? decision.evidencePriority.map((item: any) => `- ${item}`) : ["- none"]),
		"tool_posture:",
		...(decision.toolPosture.length ? decision.toolPosture.map((item: any) => `- ${item}`) : ["- none"]),
		"artifact_posture:",
		...(decision.artifactPosture.length ? decision.artifactPosture.map((item: any) => `- ${item}`) : ["- none"]),
		"decision_rules:",
		...(decision.decisionRules.length ? decision.decisionRules.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_queue:",
		...(decision.operatorQueue.length
			? decision.operatorQueue.map((item: any) => `- ${item}`)
			: ["- re_mission show"]),
		`executed_steps: ${decision.executed.length}`,
		...(decision.executed.length
			? decision.executed.map(
					(item: any) =>
						`- ${item.stepId} [${item.status}] ${item.command} :: ${truncateMiddle(String(item.output ?? "").replace(/\s+/g, " "), 260)}`,
				)
			: []),
		"blocked:",
		...(decision.blocked.length ? decision.blocked.map((item: any) => `- ${item}`) : ["- none"]),
		"decision_next_actions:",
		...(decision.nextActions.length ? decision.nextActions.map((item: any) => `- ${item}`) : ["- re_mission show"]),
		"stop_conditions:",
		...(decision.stopConditions.length ? decision.stopConditions.map((item: any) => `- ${item}`) : ["- none"]),
		`operator_next_command: ${decision.operatorQueue[0] ?? "re_mission show"}`,
		`next_decision_command: ${
			decision.mode === "run"
				? "re_verifier matrix"
				: decision.mode === "tick"
					? `re_decision_core run ${decision.target ?? "<target>"} 1`
					: `re_decision_core tick ${decision.target ?? "<target>"}`
		}`,
		"source_artifacts:",
		...(decision.sourceArtifacts.length ? decision.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
