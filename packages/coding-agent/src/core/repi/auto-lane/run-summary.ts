/** Auto-lane run summary footer (reverse-aware). */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { d } from "./deps.ts";
import type { RunAutoDecision } from "./types.ts";

export function formatAutoLaneRunSummary(input: {
	params: { lane?: string; target?: string };
	maxSteps: number;
	stepsExecuted: number;
	stopReason: string;
	decisions: RunAutoDecision[];
	outputs: string[];
}): string {
	const { params, maxSteps, stepsExecuted, stopReason, decisions, outputs } = input;
	const playbook =
		outputs.length > 0
			? d().writeRunAutoPlaybook({
					requestedLane: params.lane,
					target: params.target,
					maxSteps,
					stepsExecuted,
					stopReason,
					outputs,
				})
			: undefined;
	const reverseBlob = `${params.lane ?? ""} ${params.target ?? ""} ${stopReason} ${outputs.join("\n")}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: reverseBlob,
				target: params.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return [
		"run_auto_summary:",
		`max_steps: ${maxSteps}`,
		`steps_executed: ${stepsExecuted}`,
		`adaptive_decisions: ${decisions.length}`,
		`stop_reason: ${stopReason}`,
		...(playbook
			? [
					`playbookpath: ${playbook.path}`,
					`field_journal_anchor: ${playbook.journalAnchor}`,
					`evolution_anchor: ${playbook.evolutionAnchor}`,
				]
			: []),
		...(reverseNext.length ? ["reverse_next:", ...reverseNext.map((cmd: any) => `- ${cmd}`)] : []),
		"",
		...outputs,
	].join("\n");
}
