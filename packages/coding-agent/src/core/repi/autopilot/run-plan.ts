/** Autopilot plan-mode output with reverse capture stages. */

import { formatAutopilotBootstrap, formatAutopilotExecutionStrategy } from "../autopilot-strategy.ts";
import { formatCaseMemoryLanePlan } from "../case-memory.ts";
import { formatLaneCommandPack } from "../lane-commands/helpers.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function formatAutopilotPlan(params: {
	mission: any;
	lane: any;
	initialPack: any;
	initialCaseMemoryLanePlan: any;
	initialBootstrap: any;
	initialStrategy: any;
	target?: string;
	cleanState?: boolean;
	cleanStateSummary: string[];
}): string {
	const {
		mission,
		lane,
		initialPack,
		initialCaseMemoryLanePlan,
		initialBootstrap,
		initialStrategy,
		target,
		cleanState,
		cleanStateSummary,
	} = params;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|frida|checksec|gdb/i.test(
			JSON.stringify({
				route: mission.route,
				lane: lane.name,
				target: target ?? initialPack.target,
				pack: initialPack.commands?.map((c: any) => c.command),
			}),
		);
	const reverseStages = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: JSON.stringify({
					route: mission.route,
					lane: lane.name,
					target: target ?? initialPack.target,
				}),
				target: target ?? initialPack.target,
				includeGates: true,
			}).map((cmd: any) => `- reverse_capture: ${cmd}`)
		: [];
	return [
		"autopilot_plan:",
		`mission_id: ${mission.id}`,
		`lane: ${lane.name}`,
		`target: ${initialPack.target ?? target ?? "<TARGET>"}`,
		`clean_state: ${cleanState ? "applied" : "off"}`,
		...(cleanStateSummary.length ? cleanStateSummary.map((item: any) => `clean_state_${item}`) : []),
		"stages:",
		"- re_map target/depth -> evidence/maps artifact",
		"- bootstrap plan from route/map/command-pack/tool-index",
		"- case_memory_migrations -> case_memory_lane_plan lane reprioritize/add/skip",
		"- re_lane plan/run using latest map artifact",
		"- re_lane run-auto bounded follow-up chain",
		...reverseStages,
		"- re_complete audit",
		"",
		"## case-memory-lane-plan",
		formatCaseMemoryLanePlan(initialCaseMemoryLanePlan),
		"",
		"## bootstrap",
		formatAutopilotBootstrap(initialBootstrap),
		"",
		"## execution-strategy",
		formatAutopilotExecutionStrategy(initialStrategy),
		"",
		formatLaneCommandPack(initialStrategy.pack),
	].join("\n");
}
