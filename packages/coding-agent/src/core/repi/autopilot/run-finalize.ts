/** Autopilot run finalize: audit/reverse/journal/checkpoint. */

import { appendJournal, updateMissionCheckpoint } from "../autopilot-deps.ts";
import { formatCompletionAudit } from "../completion-audit/format.ts";
import { truncateMiddle } from "../text.ts";
import { autopilotReverseCaptureFooter } from "./run-reverse.ts";

export function finalizeAutopilotRun(params: {
	action: string;
	outputs: string[];
	mappedMission: any;
	mappedLane: any;
	strategy: any;
	pack: any;
	target?: string;
	runAuto?: boolean;
	cleanState?: boolean;
	cleanStateSummary: string[];
}): string {
	const {
		action,
		outputs,
		mappedMission,
		mappedLane,
		strategy,
		pack,
		target,
		runAuto,
		cleanState,
		cleanStateSummary,
	} = params;
	const audit = formatCompletionAudit();
	outputs.push(`## completion-audit\n${audit}`);
	const reverseFooter = autopilotReverseCaptureFooter({
		target: strategy.pack.target ?? target,
		route: typeof mappedMission.route === "string" ? mappedMission.route : mappedMission.route?.domain,
		audit,
	});
	if (reverseFooter) outputs.push(reverseFooter);
	const anchor = appendJournal(
		"autopilot",
		`${mappedMission.route.domain} ${pack.target ?? target ?? "target"}`,
		[
			`mission_id=${mappedMission.id}`,
			`lane=${mappedLane.name}`,
			`target=${strategy.pack.target ?? target ?? "<none>"}`,
			`execution_strategy=${strategy.mode}`,
			`run_auto=${runAuto !== false}`,
			`audit=${audit.split(/\r?\n/)[0] ?? "unknown"}`,
		].join("\n"),
	);
	updateMissionCheckpoint("memory_or_evolution_written", "done", anchor);
	return [
		"autopilot_result:",
		`action: ${action}`,
		`mission_id: ${mappedMission.id}`,
		`lane: ${mappedLane.name}`,
		`target: ${strategy.pack.target ?? target ?? "<TARGET>"}`,
		`execution_strategy: ${strategy.mode}`,
		`clean_state: ${cleanState ? "applied" : "off"}`,
		...(cleanStateSummary.length ? cleanStateSummary.map((item: any) => `clean_state_${item}`) : []),
		`field_journal_anchor: ${anchor}`,
		"",
		...outputs.map((output: any) => truncateMiddle(output, 16000)),
	].join("\n");
}
