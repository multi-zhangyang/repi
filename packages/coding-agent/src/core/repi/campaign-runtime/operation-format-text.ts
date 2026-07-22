/** Format operation artifact markdown. */

import type { OperationArtifact } from "../runtime-types/operation.ts";
import { truncateMiddle } from "../text.ts";

export function formatOperation(operation: OperationArtifact, path?: string): string {
	return [
		"operation_queue:",
		path ? `operation_artifact: ${path}` : undefined,
		`timestamp: ${operation.timestamp}`,
		`mode: ${operation.mode}`,
		`mission_id: ${operation.missionId ?? "none"}`,
		`route: ${operation.route ?? "none"}`,
		`target: ${operation.target ?? "<none>"}`,
		`campaign_artifact: ${operation.campaignArtifact ?? "none"}`,
		"phase_runner:",
		"- internal_dispatch: re_kernel | re_decision_core plan/tick/run | re_map | re_live_browser run/run | re_web_authz_state run/run | re_tool_index refresh | re_lane plan/run/run-auto | re_graph build | re_chain plan/compose | re_campaign plan/show | re_bootstrap plan | re_verifier/re_compiler/re_replayer/re_autofix/re_proof_loop/re_knowledge_graph | re_complete audit/scaffold",
		"steps:",
		...(operation.steps.length
			? operation.steps.map(
					(step: any) =>
						`- ${step.id} [${step.status}] phase=${step.phase} command=${step.command}${step.reason ? ` reason=${step.reason}` : ""}`,
				)
			: ["- none"]),
		`executed_steps: ${operation.executed.length}`,
		...(operation.executed.length
			? operation.executed.map(
					(item: any) =>
						`- ${item.stepId} [${item.status}] ${item.command} :: ${truncateMiddle(item.output.replace(/\s+/g, " "), 260)}`,
				)
			: []),
		"blocked:",
		...(operation.blocked.length ? operation.blocked.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(operation.nextActions.length
			? operation.nextActions.map((item: any) => `- ${item}`)
			: ["- re_complete audit"]),
		`next_operation_command: re_operation run ${operation.target ?? "<target>"} 1`,
		"source_artifacts:",
		...(operation.sourceArtifacts.length ? operation.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
