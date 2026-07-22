/** Dispatcher feedback row parsers. */

import { isDelegateWorker } from "../../delegate/pure.ts";
import { parseShellQuotedValue } from "../core.ts";
import type { DispatcherFeedbackParsedRow } from "../types.ts";

export function parseDispatcherFeedbackRow(row: string): DispatcherFeedbackParsedRow | undefined {
	if (!/dispatcher_score/i.test(row)) return undefined;
	const category = /\bcategory=([A-Za-z0-9_-]+)/i.exec(row)?.[1] ?? "unknown";
	const statusText = /\bstatus=(passed|failed|queued)\b/i.exec(row)?.[1]?.toLowerCase() ?? "queued";
	const status = (["passed", "failed", "queued"].includes(statusText) ? statusText : "queued") as
		| "passed"
		| "failed"
		| "queued";
	const score = Math.max(0, Math.min(100, Number(/\bscore=(\d+)/i.exec(row)?.[1] ?? 0)));
	const commandMatch = /\bcommand=(?:'((?:'\\''|[^'])*)'|"([^"]+)"|(\S+))/i.exec(row);
	const command =
		parseShellQuotedValue(commandMatch?.[1]) ?? commandMatch?.[2] ?? commandMatch?.[3] ?? "re_operator dispatch";
	return { category, status, score, command: command.trim(), raw: row.trim().replace(/^- /, "") };
}

export type WorkerScoreboardEntry = {
	worker: string;
	packetId: string;
	verdict: string;
	score: number;
	retryBudget: number;
	failureCost: number;
	next: string;
	raw: string;
};

export function parseWorkerScoreboardLine(line: string): WorkerScoreboardEntry | undefined {
	const match =
		/^(?<worker>[a-z0-9-]+)\s+packet=(?<packet>\S+)\s+verdict=(?<verdict>\w+)\s+score=(?<score>\d+)\s+retry_budget=(?<retry>\d+)\s+failure_cost=(?<cost>\d+)\s+next=(?<next>.*)$/i.exec(
			line.trim().replace(/^- /, ""),
		);
	if (!match?.groups || !isDelegateWorker(match.groups.worker)) return undefined;
	return {
		worker: match.groups.worker,
		packetId: match.groups.packet,
		verdict: match.groups.verdict,
		score: Number(match.groups.score),
		retryBudget: Number(match.groups.retry),
		failureCost: Number(match.groups.cost),
		next: match.groups.next.trim(),
		raw: line.trim().replace(/^- /, ""),
	};
}
