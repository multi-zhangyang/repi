/** Autonomous budget high-score promotion rows. */

import { shellQuote } from "../target.ts";
import {
	buildWorkerPromotionQueue,
	commandTargetSuffix,
	dispatcherFeedbackParsedRows,
	latestWorkerScoreboard,
} from "./deps.ts";

export function highScorePromotionRows(rows?: string[], target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	const dispatcherPromotions = dispatcherFeedbackParsedRows(rows)
		.filter((row: any) => row.status === "passed" && row.score >= 80)
		.map((row: any) =>
			[
				"promote_dispatcher high_score_route",
				`category=${row.category}`,
				`score=${row.score}`,
				`command=${shellQuote(row.command)}`,
				`-> re_reflect write${suffix} && re_knowledge_graph build${suffix} && memory/dispatcher-promotion-playbook reuse`,
			].join(" "),
		);
	const workerPromotions = buildWorkerPromotionQueue(latestWorkerScoreboard().entries, target).map(
		(row: any) => `promote_worker high_score_route ${row}`,
	);
	return Array.from(new Set([...dispatcherPromotions, ...workerPromotions])).slice(0, 24);
}
