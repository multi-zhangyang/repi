import type { MissionState } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { d } from "./deps.ts";

export function kernelNextActions(mission: MissionState | undefined, target?: string): string[] {
	const mappedTarget = d().commandTarget(target, mission?.task, ".");
	if (!mission)
		return [
			`re_mission new ${mappedTarget}`,
			`re_kernel build ${mappedTarget}`,
			`re_decision_core tick ${mappedTarget}`,
			`re_map ${mappedTarget} 2`,
		];
	const pending = new Set(
		mission.checkpoints
			.filter((checkpoint: any) => checkpoint.status !== "done")
			.map((checkpoint: any) => checkpoint.name),
	);
	const active = mission.lanes.find((lane: any) => lane.status === "in_progress") ?? mission.lanes[0];
	const lane = active?.name ?? "map";
	const actions: string[] = [];
	if (pending.has("execution_kernel_ready")) actions.push(`re_kernel build ${mappedTarget}`);
	if (pending.has("decision_core_ready")) actions.push(`re_decision_core tick ${mappedTarget}`);
	if (pending.has("passive_map_done")) actions.push(`re_map ${mappedTarget} 2`);
	if (pending.has("repro_commands_ready")) actions.push(`re_lane plan ${lane} ${mappedTarget}`);
	if (pending.has("minimal_path_proven")) actions.push(`re_lane run ${lane} ${mappedTarget}`);
	if (pending.has("operator_queue_ready")) actions.push("re_context pack", "re_complete audit");
	if (pending.has("verifier_matrix_ready")) actions.push("re_verifier matrix");
	if (pending.has("compiler_ready")) actions.push("re_compiler draft");
	if (pending.has("replay_ready")) actions.push("re_replayer run");
	if (pending.has("exploit_chain_ready")) actions.push(`re_chain plan ${mappedTarget}`);
	if (pending.has("web_authz_ready") && /web|api/i.test(mission.route.domain))
		actions.push(`re_web_authz_state run ${mappedTarget}`);
	if (pending.has("exploit_lab_ready") && /exploit|pwn/i.test(mission.route.domain))
		actions.push(`re_exploit_lab run ${mappedTarget}`);
	if (pending.has("mobile_runtime_ready") && /mobile|android/i.test(mission.route.domain))
		actions.push(`re_mobile_runtime run ${mappedTarget}`);
	if (pending.has("native_runtime_ready") && /native|pwn|reverse|exploit/i.test(mission.route.domain))
		actions.push(`re_native_runtime run ${mappedTarget}`);
	if (pending.has("autofix_ready")) actions.push("re_autofix plan");
	if (pending.has("knowledge_graph_ready")) actions.push("re_knowledge_graph build");
	actions.push("re_complete audit");
	const reverseOpen =
		/proof_exit|pending_runtime_capture|bind_ready|native|pwn|malware|firmware|reverse|binary|exploit|mobile/i.test(
			JSON.stringify({ mission, target, pending: Array.from(pending), lane }),
		);
	if (reverseOpen) {
		actions.unshift(
			...reverseDomainCaptureNextCommands({
				routeOrBlob: JSON.stringify({ mission, target, pending: Array.from(pending), lane }),
				target: mappedTarget,
			}),
		);
	}
	return Array.from(new Set(actions)).slice(0, 12);
}

export function kernelArtifactContract(): string[] {
	return [
		"mission: recon/mission/current.json tracks route, lanes, checkpoints and next actions",
		"evidence: recon/evidence/ledger.md plus maps/runs/browser/web-authz/chains/decisions/exploit-lab/mobile-runtime/native-runtime/graphs/operators/verifiers/replayers artifacts",
		"decision: recon/evidence/decisions/*.md and memory/decision-core.md bind objective_stack, check_pressure and operator_next_command",
		"memory: field-journal, evolution-log, playbooks, context packs and knowledge-graph-index",
		"report: final claims require key_evidence_block, repro_commands, verification and next step",
		"conflicts: runtime and replay artifacts override stale source comments or labels",
	];
}

export function kernelStallRecovery(): string[] {
	return [
		"same failure twice -> switch lane or create tool-bootstrap/evidence-repair/map-refresh lane",
		"blocked command -> parse tool repair anchors, generate command_substitutions and next_operator_queue",
		"low evidence_quality -> recapture runtime/traffic/hook evidence before final claims",
		"contradiction -> prefer verifier counter_evidence and rerun the smallest reproducer",
		"no artifact -> write a scaffold artifact first, then replay/verify it",
	];
}
