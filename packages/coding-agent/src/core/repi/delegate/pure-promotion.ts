/** Delegate promotion/scoreboard helpers. */
/** Delegate pure worker contracts, objectives, tools, promotion helpers. */

import { commandTargetSuffix } from "../context-pack.ts";
import { latestDispatcherFeedbackBoard, parseWorkerScoreboardLine } from "../operator-runtime.ts";
import { latestSupervisorArtifactPath, parseSupervisorArtifact } from "../supervisor.ts";
import type { DelegateWorkerScoreboardEntry } from "./types.ts";

export function dispatcherPromotionQueue(target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	return latestDispatcherFeedbackBoard()
		.hints.filter((hint: any) => /promote_dispatcher/i.test(hint))
		.map((hint: any) => {
			const score = Number(/\bscore=(\d+)/.exec(hint)?.[1] ?? 80);
			const category = /\bcategory=([A-Za-z0-9_-]+)/.exec(hint)?.[1] ?? "unknown";
			return `promote:dispatcher-feedback category=${category} score=${score} -> re_reflect write${suffix}; re_knowledge_graph build${suffix}; memory/dispatcher-feedback-board reuse`;
		})
		.slice(0, 16);
}

export function buildWorkerPromotionQueue(entries: any[], target?: string): string[] {
	const suffix = commandTargetSuffix(target);
	return entries
		.filter((entry: any) => entry.score >= 80 && /pass/i.test(entry.verdict))
		.map(
			(entry: any) =>
				`promote:${entry.worker} score=${entry.score} packet=${entry.packetId} -> re_reflect write${suffix}; re_knowledge_graph build${suffix}; memory/playbooks reuse`,
		)
		.slice(0, 16);
}

export function latestWorkerScoreboard(): { path?: string; lines: string[]; entries: DelegateWorkerScoreboardEntry[] } {
	const path = latestSupervisorArtifactPath();
	const supervisor = path ? parseSupervisorArtifact(path) : undefined;
	const lines = supervisor?.workerScoreboard ?? [];
	return {
		path,
		lines,
		entries: lines
			.map(parseWorkerScoreboardLine)
			.filter((entry): entry is DelegateWorkerScoreboardEntry => Boolean(entry)),
	};
}
