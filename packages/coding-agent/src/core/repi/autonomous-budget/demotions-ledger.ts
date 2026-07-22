/** Autonomous budget demotion ledger helpers. */

import { autonomousBudgetLedgerPath, readTextFile as readText } from "../storage.ts";
import { shellQuote } from "../target.ts";
import { interestingLines } from "../text.ts";
import { dispatcherFeedbackParsedRows } from "./deps.ts";
import type { AutonomousBudgetLedgerSnapshot } from "./types.ts";

export function latestAutonomousBudgetLedger(): AutonomousBudgetLedgerSnapshot {
	const path = autonomousBudgetLedgerPath();
	const text = readText(path);
	const rows = interestingLines(
		text,
		/score_decay|historical_score_decay|demote_|promote_|autonomous_budget|next=|re[-_]|formal_playbook/i,
		260,
	);
	const scoreDecay = rows.filter((row: any) => /score_decay|historical_score_decay/i.test(row));
	const laneDemotions = rows.filter((row: any) => /demote_lane|lane_demotion/i.test(row));
	const workerDemotions = rows.filter((row: any) => /demote_worker|worker_demotion/i.test(row));
	const dispatcherDemotions = rows.filter((row: any) => /demote_dispatcher|dispatcher_demotion/i.test(row));
	const demotions = rows.filter((row: any) => /demote_|repeated_failure|failure_demotion/i.test(row));
	const playbookPromotions = rows.filter((row: any) =>
		/formal_playbook|dispatcher-promotion-playbook|playbook_promotion/i.test(row),
	);
	const promotions = rows.filter((row: any) => /promote_|high_score|playbook_promotion|formal_playbook/i.test(row));
	const nextActions = rows
		.flatMap((row: any) => row.match(/re[-_][\w-]+(?:\s+[^\s;&|]+){0,5}/gi) ?? [])
		.map((command: any) => command.trim());
	return {
		path,
		turns: (text.match(/^## Turn /gm) ?? []).length,
		scoreDecay,
		demotions,
		laneDemotions,
		workerDemotions,
		dispatcherDemotions,
		promotions,
		playbookPromotions,
		nextActions: Array.from(new Set(nextActions)).slice(0, 24),
		rows,
	};
}

export function historicalCategoryCount(rows: string[], category: string, pattern: RegExp): number {
	return rows.filter((row: any) => pattern.test(row) && row.includes(`category=${category}`)).length;
}

export function cumulativeDispatcherScoreDecayRows(
	rows?: string[],
	ledger: AutonomousBudgetLedgerSnapshot = latestAutonomousBudgetLedger(),
): string[] {
	return dispatcherFeedbackParsedRows(rows)
		.map((row: any) => {
			const previous = historicalCategoryCount(
				ledger.scoreDecay,
				row.category,
				/score_decay|historical_score_decay/i,
			);
			if (previous <= 0) return undefined;
			const historicalDecay = Math.min(36, previous * (row.status === "passed" ? 1 : 4));
			const effective = Math.max(0, row.score - historicalDecay);
			const action =
				row.status === "passed" && effective >= 80
					? "promote_dispatcher"
					: effective < 45
						? "demote_dispatcher"
						: "retry_dispatcher";
			return [
				"historical_score_decay dispatcher",
				`category=${row.category}`,
				`status=${row.status}`,
				`previous=${previous}`,
				`score=${row.score}`,
				`historical_decay=${historicalDecay}`,
				`effective=${effective}`,
				`action=${action}`,
				`command=${shellQuote(row.command)}`,
			].join(" ");
		})
		.filter((row: any): row is string => Boolean(row))
		.slice(0, 24);
}
