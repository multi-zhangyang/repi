/** Dispatcher feedback board IO. */

import { autonomousExecutionBudget } from "../../context-pack/deps-runtime.ts";
import { memoryPath } from "../../memory-stubs.ts";
import { autonomousBudgetLines } from "../../operator-format-budget.ts";
import { ensureReconStorage } from "../../resources.ts";
import { readTextFile as readText, writePrivateTextFile } from "../../storage.ts";
import { interestingLines } from "../../text.ts";
import { writeDispatcherPromotionPlaybook } from "../deps.ts";

export function latestDispatcherFeedbackBoard(): { path: string; lines: string[]; hints: string[] } {
	const path = memoryPath("dispatcher-feedback-board.md");
	const text = readText(path);
	return {
		path,
		lines: interestingLines(text, /dispatcher_score|promote_dispatcher|demote_dispatcher|retry_dispatcher/i, 80),
		hints: interestingLines(text, /promote_dispatcher|demote_dispatcher|retry_dispatcher|re[-_]/i, 40),
	};
}

export function writeDispatcherFeedbackBoard(operator: any, artifactPath: string): string {
	ensureReconStorage();
	const boardPath = memoryPath("dispatcher-feedback-board.md");
	const scoreboard = operator.dispatcherFeedbackScoreboard ?? [];
	const hints = operator.dispatcherLearningHints ?? [];
	const budget = autonomousExecutionBudget(operator.target, scoreboard);
	writePrivateTextFile(
		boardPath,
		[
			"# REPI Dispatcher Feedback Board",
			"",
			`Updated: ${operator.timestamp}`,
			`Operator artifact: ${artifactPath}`,
			`Target: ${operator.target ?? "<none>"}`,
			`Mode: ${operator.mode}`,
			"",
			"## Scoreboard",
			...(scoreboard.length ? scoreboard.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Learning hints",
			...(hints.length ? hints.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Autonomous execution budget",
			...autonomousBudgetLines(budget).map((item: any) => `- ${item}`),
			"",
			"## Score decay",
			...(budget.scoreDecay.length ? budget.scoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Repeated failure demotions",
			...(budget.demotionRules.length ? budget.demotionRules.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## High-score promotions",
			...(budget.promotionRules.length ? budget.promotionRules.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Fallback plan",
			...((operator.dispatcherFallbackPlan ?? []).length
				? (operator.dispatcherFallbackPlan ?? []).map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
		].join("\n"),
	);
	writeDispatcherPromotionPlaybook({
		target: operator.target,
		timestamp: operator.timestamp,
		artifactPath,
		scoreboard,
		learningHints: hints,
	});
	return boardPath;
}
