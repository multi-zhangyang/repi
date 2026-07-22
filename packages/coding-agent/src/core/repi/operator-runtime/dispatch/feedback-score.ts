/** Dispatcher feedback scoreboard/status. */

import { latestDispatcherFeedbackBoard } from "../../knowledge-graph/deps.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { shellQuote } from "../../target.ts";
import { truncateMiddle } from "../../text.ts";
import { operatorFeedbackDispatcherCommands, operatorFeedbackFallbackCommands } from "../feedback.ts";
import { operatorFeedbackCategory } from "../feedback-category.ts";
import type { DispatcherFeedbackParsedRow } from "../types.ts";
import { parseDispatcherFeedbackRow } from "./feedback-parse.ts";
import { dispatcherFeedbackScore } from "./feedback-score-calc.ts";

export function dispatcherFeedbackExecutionStatus(command: string, executions: any[]): "passed" | "failed" | "queued" {
	const normalized = command.trim().replace(/^\//, "");
	const execution = executions.find((item: any) => item.command.trim().replace(/^\//, "") === normalized);
	if (!execution) return "queued";
	return execution.status === "blocked" ? "failed" : "passed";
}

export function dispatcherFeedbackParsedRows(rows?: string[]): DispatcherFeedbackParsedRow[] {
	const source = rows ?? latestDispatcherFeedbackBoard().lines;
	const seen = new Set<string>();
	return source
		.map(parseDispatcherFeedbackRow)
		.filter((row: any): row is DispatcherFeedbackParsedRow => Boolean(row))
		.filter((row: any) => {
			const key = `${row.category}:${row.status}:${row.score}:${row.command}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
}

export function dispatcherFeedbackScoreboard(operator: {
	operatorFeedback?: string[];
	executed: any[];
	target?: string;
}): string[] {
	return (operator.operatorFeedback ?? [])
		.flatMap((row: any) => {
			const category = operatorFeedbackCategory(row);
			const commands = operatorFeedbackFallbackCommands(row, operator.target);
			const candidates = commands.length ? commands : operatorFeedbackDispatcherCommands([row], operator.target);
			return candidates.slice(0, 5).map((command: any) => {
				const status = dispatcherFeedbackExecutionStatus(command, operator.executed);
				const score = dispatcherFeedbackScore(command, status, category);
				return [
					"dispatcher_score",
					`category=${category}`,
					`status=${status}`,
					`score=${score}`,
					`command=${shellQuote(command)}`,
					`evidence=${shellQuote(truncateMiddle(row, 220))}`,
				].join(" ");
			});
		})
		.filter((row, index, rows) => rows.indexOf(row) === index)
		.sort((a: any, b: any) => {
			const leftStatus = /\bstatus=passed\b/.test(a) ? 0 : /\bstatus=queued\b/.test(a) ? 1 : 2;
			const rightStatus = /\bstatus=passed\b/.test(b) ? 0 : /\bstatus=queued\b/.test(b) ? 1 : 2;
			const leftScore = Number(/\bscore=(\d+)/.exec(a)?.[1] ?? 0);
			const rightScore = Number(/\bscore=(\d+)/.exec(b)?.[1] ?? 0);
			return leftStatus - rightStatus || rightScore - leftScore || a.localeCompare(b);
		})
		.slice(0, 40);
}

export function dispatcherLearningHints(scoreboard: string[], target?: string): string[] {
	const targetRef = target ?? "<target>";
	const hints = scoreboard.map((row: any) => {
		const status = /\bstatus=([a-z]+)/i.exec(row)?.[1] ?? "queued";
		const score = Number(/\bscore=(\d+)/.exec(row)?.[1] ?? 0);
		const category = /\bcategory=([A-Za-z0-9_-]+)/.exec(row)?.[1] ?? "unknown";
		const command = /\bcommand=(?:'([^']+)'|"([^"]+)"|(\S+))/i.exec(row);
		const commandText = command?.[1] ?? command?.[2] ?? command?.[3] ?? "re_operator dispatch";
		if (status === "passed" && score >= 80)
			return `promote_dispatcher category=${category} score=${score} command=${commandText} -> re_knowledge_graph build ${targetRef}`;
		if (status === "failed")
			return `demote_dispatcher category=${category} score=${score} command=${commandText} -> re_autofix plan ${targetRef}; re_context pack ${targetRef}`;
		return `retry_dispatcher category=${category} score=${score} command=${commandText} -> re_operator dispatch ${targetRef} 1`;
	});
	const reverseBlob = `${(scoreboard ?? []).join("\n")} ${target ?? ""}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		);
	if (reverseHeavy) {
		hints.push(
			...reverseDomainCaptureNextCommands({ routeOrBlob: reverseBlob, target }).map(
				(c: any) => `reverse_next: ${c}`,
			),
		);
	}
	return Array.from(new Set(hints)).slice(0, 24);
}
