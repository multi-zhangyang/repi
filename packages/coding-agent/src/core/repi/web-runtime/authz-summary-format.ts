/** Web authz format. */
/** Web authz anchors/format/summary with reverse proof fields. */

import type { WebAuthzStateArtifact } from "./types.ts";

export function formatWebAuthzState(authz: WebAuthzStateArtifact, path?: string): string {
	return [
		"web_authz_state:",
		path ? `web_authz_artifact: ${path}` : undefined,
		`timestamp: ${authz.timestamp}`,
		`mode: ${authz.mode}`,
		`mission_id: ${authz.missionId ?? "none"}`,
		`route: ${authz.route ?? "none"}`,
		`target: ${authz.target ?? "<missing>"}`,
		`url: ${authz.url ?? "<missing>"}`,
		`timeout_ms: ${authz.timeoutMs}`,
		"route_inventory:",
		...(authz.routeInventory.length ? authz.routeInventory.map((item: any) => `- ${item}`) : ["- none"]),
		"principal_matrix:",
		...(authz.principalMatrix.length ? authz.principalMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"object_probes:",
		...(authz.objectProbes.length ? authz.objectProbes.map((item: any) => `- ${item}`) : ["- none"]),
		"state_machine:",
		...(authz.stateMachine.length ? authz.stateMachine.map((item: any) => `- ${item}`) : ["- none"]),
		"sequence_replay:",
		...(authz.sequenceReplay.length ? authz.sequenceReplay.map((item: any) => `- ${item}`) : ["- none"]),
		"ownership_checks:",
		...(authz.ownershipChecks.length ? authz.ownershipChecks.map((item: any) => `- ${item}`) : ["- none"]),
		"rollback_checks:",
		...(authz.rollbackChecks.length ? authz.rollbackChecks.map((item: any) => `- ${item}`) : ["- none"]),
		"executions:",
		...(authz.executions.length
			? authz.executions.map(
					(item: any) =>
						`- ${item.label} [${item.status}] exit=${item.exit ?? "n/a"} stdout_sha256=${item.stdoutHash ?? "n/a"} stderr_sha256=${item.stderrHash ?? "n/a"}`,
				)
			: ["- planned web authz state capture; run re_web_authz_state run <url> [timeout-ms]"]),
		"runtime_anchors:",
		...(authz.runtimeAnchors.length ? authz.runtimeAnchors.map((item: any) => `- ${item}`) : ["- none"]),
		"replay_commands:",
		...(authz.replayCommands.length ? authz.replayCommands.map((item: any) => `- ${item}`) : ["- none"]),
		"capture_script:",
		"```bash",
		authz.captureScript,
		"```",
		"web_authz_next_actions:",
		...(authz.nextActions.length ? authz.nextActions.map((item: any) => `- ${item}`) : ["- re_verifier matrix"]),
		`next_web_authz_command: ${authz.mode === "run" ? "re_verifier matrix" : `re_web_authz_state run ${authz.url ?? "<url>"}`}`,
		"source_artifacts:",
		...(authz.sourceArtifacts.length ? authz.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
