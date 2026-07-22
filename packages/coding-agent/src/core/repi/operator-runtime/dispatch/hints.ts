/** Worker/dispatcher adaptive routing hints and commander policy. */
import type { ContextPackArtifact } from "../../context-pack.ts";
import { delegateTools } from "../../delegate/pure.ts";
import { commandTargetSuffix } from "../deps.ts";
import { isCommanderRuntimeCommand } from "./budget.ts";
import { latestDispatcherFeedbackBoard } from "./feedback-board.ts";

export function workerAdaptiveRoutingHints(entries: any[], target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	const reverseCmds = [
		"re_domain_proof_exit show",
		"re_runtime_adapter run",
		"reverse capture gate: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
	];
	const __hints = entries
		.flatMap((entry: any) => {
			if (entry.score >= 80 && /pass/i.test(entry.verdict)) return [];
			if (entry.score >= 60 && /watch/i.test(entry.verdict))
				return [
					`watch:${entry.worker} score=${entry.score} -> collect one more runtime/traffic/artifact anchor before expansion; command=re_swarm run${suffix} 1 1`,
				];
			const tools = delegateTools(entry.worker).slice(0, 5).join(" ");
			return [
				`repair:${entry.worker} score=${entry.score} verdict=${entry.verdict} -> reroute via evidence-repair lane; commands=re_bootstrap plan ${tools} && re_delegate plan${suffix} && re_swarm run${suffix} 1 1 && re_verifier matrix`,
				`verify:${entry.worker} packet=${entry.packetId} -> require negative control + replay artifact before merge; next=${entry.next}`,
			];
		})
		.slice(0, 24);
	return Array.from(new Set([...reverseCmds, ...__hints])).slice(0, 24);
}
export function dispatcherAdaptiveRoutingHints(target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	const reverseCmds = [
		"re_domain_proof_exit show",
		"re_runtime_adapter run",
		"reverse capture gate: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
	];
	const __hints = latestDispatcherFeedbackBoard()
		.hints.map((hint: any) => {
			const score = Number(/\bscore=(\d+)/.exec(hint)?.[1] ?? 50);
			const category = /\bcategory=([A-Za-z0-9_-]+)/.exec(hint)?.[1] ?? "unknown";
			const command = /\bcommand=(.+?)(?:\s+->|$)/.exec(hint)?.[1]?.trim() ?? "re_operator dispatch";
			if (/promote_dispatcher/i.test(hint)) {
				return `promote:dispatcher category=${category} score=${score} -> reuse ${command}; re_reflect write${suffix}; re_knowledge_graph build${suffix}`;
			}
			if (/demote_dispatcher/i.test(hint)) {
				return `repair:dispatcher category=${category} score=${score} -> demote ${command}; commands=re_autofix plan${suffix} && re_context pack${suffix} && re_operator dispatch${suffix} 1`;
			}
			return `watch:dispatcher category=${category} score=${score} -> bounded retry ${command}; command=re_operator dispatch${suffix} 1`;
		})
		.slice(0, 24);
	return Array.from(new Set([...reverseCmds, ...__hints])).slice(0, 24);
}
export function commanderPolicyFromContext(context: ContextPackArtifact): string[] {
	const commanderQueueDepth = (context.repairQueue ?? []).filter(isCommanderRuntimeCommand).length;
	const inheritedBudget = context.commanderMergeBudget ?? [];
	return Array.from(
		new Set([
			"reverse_rule=require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
			"reverse_next=re_domain_proof_exit show",
			"reverse_next=re_runtime_adapter run",

			...inheritedBudget,
			`context_commander_queue=${commanderQueueDepth}`,
			`worker_score_rows=${context.workerScoreboard?.length ?? 0}`,
			`swarm_retry_queue=${context.swarmRetryQueue?.length ?? 0}`,
			`case_memory_lane_plan=${context.caseMemoryLanePlan?.action ?? "none"}`,
			`case_memory_next_commands=${context.caseMemoryNextCommands?.length ?? 0}`,
			"retry_scope=commander-runtime-only",
			"stop_rule=halt dispatch when failure_budget is exhausted",
		]),
	).slice(0, 20);
}
