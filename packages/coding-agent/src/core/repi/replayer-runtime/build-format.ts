/** Replayer format output with reverse proof gate lines. */
import type { ReplayArtifact } from "../runtime-types.ts";

export function formatReplayer(replay: ReplayArtifact, path?: string): string {
	return [
		"replay_matrix:",
		path ? `replay_artifact: ${path}` : undefined,
		`timestamp: ${replay.timestamp}`,
		`mode: ${replay.mode}`,
		`mission_id: ${replay.missionId ?? "none"}`,
		`route: ${replay.route ?? "none"}`,
		`target: ${replay.target ?? "<none>"}`,
		`compiler_artifact: ${replay.compilerArtifact ?? "none"}`,
		"operator_feedback:",
		...((replay.operatorFeedback ?? []).length
			? (replay.operatorFeedback ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		`passed: ${replay.passed}`,
		`failed: ${replay.failed}`,
		`blocked_count: ${replay.blocked.length}`,
		"steps:",
		...(replay.steps.length
			? replay.steps.map(
					(step: any) =>
						`- ${step.id} [${step.status}] command=${step.command}${step.reason ? ` reason=${step.reason}` : ""}`,
				)
			: ["- none"]),
		`executed_steps: ${replay.executions.length}`,
		...(replay.executions.length
			? replay.executions.map(
					(execution) =>
						`- ${execution.stepId} [${execution.status}] exit=${execution.exit} stdout_sha256=${execution.stdoutHash} stderr_sha256=${execution.stderrHash} command=${execution.command}`,
				)
			: []),
		"replay_matrix_rows:",
		...(replay.replayMatrix.length ? replay.replayMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"blocked:",
		...(replay.blocked.length ? replay.blocked.map((item: any) => `- ${item}`) : ["- none"]),
		"next_replay_actions:",
		...(replay.nextActions.length ? replay.nextActions.map((item: any) => `- ${item}`) : ["- re_complete audit"]),
		"reverse_proof_gate:",
		`- require_proof_exit_before_claim: ${replay.failed > 0 || replay.blocked.length > 0 ? "enforced_on_failure" : "watch"}`,
		`- domain_proof_exit_command: re_domain_proof_exit show`,
		`next_replay_command: ${replay.steps.some((step: any) => step.status === "ready") ? `re_replayer run ${replay.target ?? "<target>"} 1` : "re_complete audit"}`,
		"source_artifacts:",
		...(replay.sourceArtifacts.length ? replay.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
