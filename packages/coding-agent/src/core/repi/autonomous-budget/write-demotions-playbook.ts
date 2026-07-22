import { join } from "node:path";
/** Formal dispatcher promotion playbook writer. */
import type { AutonomousExecutionBudget } from "../operator-format.ts";
import { autonomousBudgetLines } from "../operator-format-budget.ts";
import { memoryPlaybooksDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvolution, appendJournal, maintainPlaybooks, readCurrentMission } from "./deps.ts";

export function writeFormalDispatcherPromotionPlaybook(params: {
	budget: AutonomousExecutionBudget;
	timestamp: string;
	target?: string;
	artifactPath?: string;
	learningHints?: string[];
}): string | undefined {
	if (params.budget.playbookPromotions.length === 0) return undefined;
	const route = readCurrentMission()?.route.domain ?? "dispatcher";
	const score = Math.max(
		82,
		...params.budget.playbookPromotions.map((row: any) => Number(/\bscore=(\d+)/.exec(row)?.[1] ?? 0)),
	);
	const title = `dispatcher-promotion ${route}`;
	const path = join(memoryPlaybooksDir(), `${params.timestamp.replace(/[:.]/g, "-")}-${slug(title)}.md`);
	// Atomic temp+rename (0o600): read back via readText by maintainPlaybooks;
	// a torn writeFileSync would mis-rank/archive with no error. #43/#103.
	writePrivateTextFile(
		path,
		[
			"# REPI Dispatcher Promotion Playbook",
			"",
			`timestamp: ${params.timestamp}`,
			`route: ${route}`,
			"requested_lane: dispatcher-promotion",
			`target: ${params.target ?? "<none>"}`,
			`source_artifact: ${params.artifactPath ?? "none"}`,
			`quality_score: ${score}`,
			`promotion_count: ${params.budget.playbookPromotions.length}`,
			`demotion_count: ${params.budget.demotionRules.length}`,
			"",
			"## High-score promotions",
			...(params.budget.playbookPromotions.length
				? params.budget.playbookPromotions.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Autonomous budget",
			...autonomousBudgetLines(params.budget).map((item: any) => `- ${item}`),
			"",
			"## Reusable commands",
			...(params.budget.nextActions.length ? params.budget.nextActions.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Dispatcher learning hints",
			...(params.learningHints?.length ? params.learningHints.map((item: any) => `- ${item}`) : ["- none"]),
			"",
		].join("\n"),
	);
	appendJournal(
		"dispatcher-promotion-playbook",
		title,
		[
			`formal_playbook: ${path}`,
			`quality_score=${score}; promotions=${params.budget.playbookPromotions.length}; demotions=${params.budget.demotionRules.length}`,
			...params.budget.playbookPromotions.slice(0, 6).map((item: any) => `promotion: ${item}`),
		].join("\n"),
	);
	appendEvolution(
		`dispatcher promotion ${route}`,
		[
			`Promoted high-score dispatcher/worker route into formal playbook: ${path}`,
			`target=${params.target ?? "<none>"}; source=${params.artifactPath ?? "none"}`,
			`autonomous_budget=${params.budget.maxTurns}/${params.budget.maxDispatch}/${params.budget.maxProofLoops}; score_decay=${params.budget.scoreDecay.length}`,
			"Policy: future case-memory migrations should prefer this route before repeating low-score dispatcher fallbacks.",
		].join("\n"),
	);
	maintainPlaybooks({ archive: true });
	return path;
}
