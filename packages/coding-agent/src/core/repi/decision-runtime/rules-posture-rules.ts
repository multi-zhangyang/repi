/** Decision rules + objective stack (reverse capture pending). */
/** Decision-core pure rules and posture helpers. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { truncateMiddle } from "../text.ts";
import { commandTarget } from "./deps.ts";

export function decisionObjectiveStack(mission: any | undefined, active: any | undefined, target?: string): string[] {
	const mappedTarget = commandTarget(target, mission?.task);
	if (!mission) {
		const mapped = mappedTarget === "<target>" ? "<task-or-target>" : mappedTarget;
		return [
			`bootstrap mission for ${mapped}`,
			`route task: re_route ${mapped}`,
			`create blackboard: re_mission new ${mapped}`,
			`build execution kernel: re_kernel build ${mapped}`,
		];
	}
	const pending = mission.checkpoints
		.filter((checkpoint: any) => checkpoint.status !== "done")
		.map((checkpoint: any) => checkpoint.name);
	return [
		`route=${mission.route.domain}`,
		`task=${truncateMiddle(mission.task, 180)}`,
		`active_lane=${active?.name ?? "none"}`,
		`active_objective=${active?.objective ?? "select next lane"}`,
		`target=${mappedTarget}`,
		`pending_checks=${pending.slice(0, 16).join(",") || "none"}`,
		"primary_invariant=prove one end-to-end evidence path before broad expansion",
	];
}

export function decisionRulesFor(mission: any | undefined, active: any | undefined, target?: string): string[] {
	const mappedTarget = commandTarget(target, mission?.task);
	const reverseOpen =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|technique|proof_exit|bind_ready/i.test(
			JSON.stringify({ mission, active, target }),
		);
	const reverseRules = reverseOpen
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${mission?.route?.domain ?? ""} ${active?.name ?? ""} ${target ?? ""} reverse`,
				target: mappedTarget === "<target>" ? undefined : mappedTarget,
			}).map((cmd: any) => `reverse_capture_pending -> ${cmd}`)
		: [];
	if (!mission)
		return [
			...reverseRules,
			`no_mission -> re_mission new ${mappedTarget}`,
			`no_kernel -> re_kernel build ${mappedTarget}`,
			`no_map -> re_map ${mappedTarget} 2`,
		];
	const pending = new Set(
		mission.checkpoints
			.filter((checkpoint: any) => checkpoint.status !== "done")
			.map((checkpoint: any) => checkpoint.name),
	);
	const lane = active?.name ?? "triage";
	const rules: string[] = [...reverseRules];
	if (pending.has("execution_kernel_ready")) rules.push(`execution_kernel_gap -> re_kernel build ${mappedTarget}`);
	if (pending.has("tool_index_checked")) rules.push("tool_posture_unknown -> re_tool_index refresh");
	if (pending.has("passive_map_done")) rules.push(`map_gap -> re_map ${mappedTarget} 2`);
	if (pending.has("repro_commands_ready")) rules.push(`command_pack_gap -> re_lane plan ${lane} ${mappedTarget}`);
	if (pending.has("minimal_path_proven")) rules.push(`proof_gap -> re_lane run ${lane} ${mappedTarget}`);
	if (pending.has("attack_graph_ready")) rules.push("graph_gap -> re_graph build");
	if (pending.has("exploit_chain_ready")) rules.push(`chain_gap -> re_chain plan ${mappedTarget}`);
	if (pending.has("context_pack_ready")) rules.push(`context_gap -> re_context pack ${mappedTarget}`);
	if (pending.has("operator_queue_ready")) {
		const reverseHeavy =
			/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
				`${mappedTarget} ${[...pending].join(" ")}`,
			);
		if (reverseHeavy) {
			for (const cmd of reverseDomainCaptureNextCommands({ routeOrBlob: `${mappedTarget}`, target: mappedTarget })) {
				rules.push(`operator_gap -> ${cmd}`);
			}
		} else {
			rules.push(`operator_gap -> re_operator plan ${mappedTarget}`);
		}
	}
	if (pending.has("verifier_matrix_ready")) rules.push(`verification_gap -> re_verifier matrix ${mappedTarget}`);
	if (pending.has("compiler_ready")) rules.push(`compiler_gap -> re_compiler draft ${mappedTarget}`);
	if (pending.has("replay_ready")) rules.push(`replay_gap -> re_replayer run ${mappedTarget} 1`);
	if (pending.has("autofix_ready")) rules.push(`repair_gap -> re_autofix plan ${mappedTarget}`);
	if (pending.has("proof_loop_ready")) rules.push(`proof_loop_gap -> re_proof_loop run ${mappedTarget} 4`);
	if (pending.has("knowledge_graph_ready")) rules.push(`knowledge_gap -> re_knowledge_graph build ${mappedTarget}`);
	if (pending.has("report_or_writeup_ready")) rules.push("report_gap -> re_complete scaffold");
	if (rules.length === reverseRules.length) rules.push("all_checks_green -> re_complete audit");
	return Array.from(new Set(rules));
}
