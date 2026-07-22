/** Worker/dispatcher demotion row builders. */

import type { DispatcherFeedbackParsedRow } from "../operator-runtime.ts";
import { shellQuote } from "../target.ts";
import { latestAutonomousBudgetLedger } from "./demotions-ledger.ts";
import { commandTargetSuffix, dispatcherFeedbackParsedRows, latestWorkerScoreboard } from "./deps.ts";
import type { AutonomousBudgetLedgerSnapshot } from "./types.ts";

export function workerScoreDemotionRows(
	target?: string,
	ledger: AutonomousBudgetLedgerSnapshot = latestAutonomousBudgetLedger(),
): string[] {
	const suffix = commandTargetSuffix(target);
	return latestWorkerScoreboard()
		.entries.filter((entry: any) => entry.score < 50 || /blocked|repair/i.test(entry.verdict))
		.map((entry: any) => {
			const previous = ledger.workerDemotions.filter((row: any) => row.includes(`worker=${entry.worker}`)).length;
			const effective = Math.max(0, entry.score - Math.min(24, previous * 4));
			return [
				"demote_worker repeated_low_score",
				`worker=${entry.worker}`,
				`verdict=${entry.verdict}`,
				`score=${entry.score}`,
				`previous=${previous}`,
				`effective=${effective}`,
				`packet=${entry.packetId}`,
				`-> re_delegate plan${suffix} && re_swarm run${suffix} 1 1 && re_supervisor repair${suffix}`,
			].join(" ");
		})
		.slice(0, 16);
}

export function dispatcherScoreDecayRows(rows?: string[]): string[] {
	const parsed = dispatcherFeedbackParsedRows(rows);
	return parsed
		.map((row: any) => {
			const decay = row.status === "passed" ? 0 : row.status === "failed" ? 30 : row.score >= 75 ? 6 : 10;
			const effective = Math.max(0, row.score - decay);
			const action =
				row.status === "passed" && row.score >= 80
					? "promote_dispatcher"
					: row.status === "failed" || effective < 40
						? "demote_dispatcher"
						: "retry_dispatcher";
			return [
				"score_decay dispatcher",
				`category=${row.category}`,
				`status=${row.status}`,
				`score=${row.score}`,
				`decay=${decay}`,
				`effective=${effective}`,
				`action=${action}`,
				`command=${shellQuote(row.command)}`,
			].join(" ");
		})
		.slice(0, 32);
}

export function repeatedFailureDemotionRows(rows?: string[], target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	const grouped = new Map<string, DispatcherFeedbackParsedRow[]>();
	for (const row of dispatcherFeedbackParsedRows(rows)) {
		const key = `${row.category}:${row.command}`;
		grouped.set(key, [...(grouped.get(key) ?? []), row]);
	}
	const demotions: string[] = [];
	for (const group of grouped.values()) {
		const latest = group[group.length - 1];
		if (!latest) continue;
		const failed = group.filter((row: any) => row.status === "failed").length;
		const queued = group.filter((row: any) => row.status === "queued").length;
		const effective = Math.max(
			0,
			latest.score - (latest.status === "failed" ? 30 : latest.status === "queued" ? 10 : 0),
		);
		if (failed === 0 && queued < 2 && effective >= 40) continue;
		demotions.push(
			[
				"demote_dispatcher repeated_failure",
				`category=${latest.category}`,
				`failed=${failed}`,
				`queued=${queued}`,
				`effective=${effective}`,
				`command=${shellQuote(latest.command)}`,
				`-> re_autofix plan${suffix} && re_context pack${suffix} && re_operator dispatch${suffix} 1`,
			].join(" "),
		);
	}
	return Array.from(new Set(demotions)).slice(0, 24);
}
