/** Operator feedback priority/dispatch helpers with reverse next. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import { operatorFeedbackCategory } from "./feedback-category.ts";
import {
	operatorCommandConcrete,
	operatorFeedbackFallbackCommands,
	operatorFeedbackNextCommands,
} from "./feedback-next.ts";

export function operatorStepPriority(command: string): number {
	if (/^re[-_]tool|^re[-_]bootstrap/i.test(command)) return 10;
	if (/^re[-_]decision[-_]core/i.test(command)) return 12;
	if (/^re[-_]autopilot|^re[-_]auto\b/i.test(command)) return 18;
	if (/^re[-_]map|^re[-_]lane\s+plan/i.test(command)) return 20;
	if (/^re[-_]lane\s+(run|run-auto)|^re[-_]graph/i.test(command)) return 30;
	if (/^re[-_]campaign|^re[-_]operation|^re[-_]delegate/i.test(command)) return 40;
	if (/^re[-_]swarm/i.test(command)) return 42;
	if (/^re[-_]supervisor|^re[-_]reflect/i.test(command)) return 50;
	if (/^re[-_]context|^re[-_]memory/i.test(command)) return 60;
	if (/^re[-_]verifier/i.test(command)) return 65;
	if (/^re[-_]proof[-_]loop/i.test(command)) return 66;
	if (/^re[-_]compiler/i.test(command)) return 68;
	if (/^re[-_]replayer/i.test(command)) return 69;
	if (
		/^re[-_]domain[-_]proof[-_]exit|^re[-_]runtime[-_]adapter|^re[-_]js[-_]signing|^re[-_]live[-_]browser|^re[-_]web[-_]authz[-_]state|^re[-_]exploit[-_]lab|^re[-_]mobile[-_]runtime|^re[-_]native[-_]runtime/i.test(
			command,
		)
	)
		return 69.3;
	if (/^re[-_]autofix/i.test(command)) return 69.5;
	if (/^re[-_]knowledge/i.test(command)) return 69.7;
	if (/^re[-_]complete/i.test(command)) return 70;
	return 90;
}
export function operatorFeedbackDispatchPlan(rows: string[], target?: string): string[] {
	return rows
		.map((row: any) => {
			const category = operatorFeedbackCategory(row);
			const fallback = operatorFeedbackFallbackCommands(row, target);
			const primary = operatorFeedbackNextCommands([row])[0] ?? fallback[0] ?? "re_operator dispatch";
			return [
				"dispatcher_feedback_priority",
				`category=${category}`,
				`priority=${operatorFeedbackPriority(category)}`,
				`primary=${shellQuote(operatorCommandConcrete(primary, target).command)}`,
				`fallback=${shellQuote(fallback.join(" && ") || "none")}`,
				`evidence=${shellQuote(truncateMiddle(row, 220))}`,
			].join(" ");
		})
		.sort((a: any, b: any) => {
			const left = Number(/\bpriority=(\d+)/.exec(a)?.[1] ?? 99);
			const right = Number(/\bpriority=(\d+)/.exec(b)?.[1] ?? 99);
			return left - right || a.localeCompare(b);
		})
		.slice(0, 24);
}
export function operatorFeedbackDispatcherCommands(rows: string[], target?: string): string[] {
	const reverseBlob = rows.join("\n");
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${target ?? ""} ${reverseBlob}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${target ?? ""} ${reverseBlob}`,
				target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return Array.from(
		new Set([
			...reverseNext,
			...operatorFeedbackNextCommands(rows),
			...rows.flatMap((row: any) => operatorFeedbackFallbackCommands(row, target)),
		]),
	)
		.map((command: any) => operatorCommandConcrete(command, target).command)
		.filter((command: any) => /^re[-_]/i.test(command))
		.slice(0, 20);
}
export function operatorFeedbackPriority(category: string): number {
	if (/missing_tool_or_dependency/i.test(category)) return 5;
	if (/unresolved_target/i.test(category)) return 6;
	if (/runtime_failure|dispatcher_gap/i.test(category)) return 7;
	if (/failure_budget_exhausted/i.test(category)) return 8;
	if (/swarm_retry_queue|worker_retry_blocked/i.test(category)) return 9;
	if (/replay_or_exploit_candidate/i.test(category)) return 11;
	if (/worker_retry_progress/i.test(category)) return 15;
	if (/strong_evidence/i.test(category)) return 18;
	return 25;
}
