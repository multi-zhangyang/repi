/** Context-pack compact-resume / repair / budget / next sections. */
import { autonomousBudgetLines } from "../operator-format.ts";
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPackMemoryQueueSections(pack: ContextPackFormatView): Array<string | undefined> {
	return [
		"compact_resume_ledger_v2:",
		`- CompactResumeLedgerV2=${pack.compactResumeLedgerV2?.CompactResumeLedgerV2 ?? false}`,
		`- append_only_transition_ledger=${pack.compactResumeLedgerV2?.append_only_transition_ledger ?? false}`,
		`- idempotent_multi_compact_replay=${pack.compactResumeLedgerV2?.idempotent_multi_compact_replay ?? false}`,
		`- auto_resume_budget_enforced=${pack.compactResumeLedgerV2?.auto_resume_budget_enforced ?? false}`,
		`- current_state=${pack.compactResumeLedgerV2?.currentState ?? "unknown"}`,
		`- transitions=${pack.compactResumeLedgerV2?.transitions.length ?? 0}`,
		`- invalid_transitions=${pack.compactResumeLedgerV2?.invalidTransitions.length ?? 0}`,
		`- report=${pack.compactResumeLedgerV2?.reportPath ?? "none"}`,
		`- transition_path=${pack.compactResumeLedgerV2?.transitionPath ?? "none"}`,
		"repair_queue:",
		...(pack.repairQueue.length ? pack.repairQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"commander_merge_budget:",
		...(pack.commanderMergeBudget?.length ? pack.commanderMergeBudget.map((item: any) => `- ${item}`) : ["- none"]),
		"worker_scoreboard:",
		...(pack.workerScoreboard?.length ? pack.workerScoreboard.map((item: any) => `- ${item}`) : ["- none"]),
		"swarm_retry_queue:",
		...(pack.swarmRetryQueue?.length ? pack.swarmRetryQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"autonomous_execution_budget:",
		...autonomousBudgetLines(pack.autonomousBudget).map((item: any) => `- ${item}`),
		"dispatcher_score_decay:",
		...(pack.dispatcherScoreDecay?.length ? pack.dispatcherScoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
		"repeated_failure_demotions:",
		...(pack.repeatedFailureDemotions?.length
			? pack.repeatedFailureDemotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"high_score_promotions:",
		...(pack.highScorePromotions?.length ? pack.highScorePromotions.map((item: any) => `- ${item}`) : ["- none"]),
		"case_memory_lane_plan:",
		"- removed",
		"case_memory_next_commands:",
		"- removed",
		"reflection_reuse_rules:",
		...(pack.reflectionReuseRules.length ? pack.reflectionReuseRules.map((item: any) => `- ${item}`) : ["- none"]),
		"next_operator_commands:",
		...(pack.nextCommands.length ? pack.nextCommands.map((item: any) => `- ${item}`) : ["- re_mission show"]),
		`next_context_command: ${pack.mode === "resume" ? "re_context pack" : "re_context resume"}`,
		"source_artifacts:",
		...(pack.sourceArtifacts.length ? pack.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	];
}
