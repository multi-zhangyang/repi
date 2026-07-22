import { memoryPath } from "../memory-stubs.ts";
/** Dispatcher promotion playbook writer with reverse next. */
/** Autonomous budget ledger/playbook writers. */
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { writePrivateTextFile } from "../storage.ts";
import { autonomousBudgetLines, autonomousExecutionBudget } from "./deps.ts";
import { applyAutonomousBudgetDemotions } from "./write-demotions-apply.ts";
import { writeFormalDispatcherPromotionPlaybook } from "./write-demotions-playbook.ts";
import { writeAutonomousBudgetLedger } from "./write-ledger-core.ts";

export function writeDispatcherPromotionPlaybook(options: {
	target?: string;
	timestamp?: string;
	artifactPath?: string;
	scoreboard?: string[];
	learningHints?: string[];
}): string {
	ensureReconStorage();
	const timestamp = options.timestamp ?? new Date().toISOString();
	const path = memoryPath("dispatcher-promotion-playbook.md");
	const budget = autonomousExecutionBudget(options.target, options.scoreboard);
	const formalPlaybookPath = writeFormalDispatcherPromotionPlaybook({
		budget,
		timestamp,
		target: options.target,
		artifactPath: options.artifactPath,
		learningHints: options.learningHints,
	});
	if (formalPlaybookPath) budget.formalPlaybookPath = formalPlaybookPath;
	const ledgerPath = writeAutonomousBudgetLedger({
		budget,
		timestamp,
		target: options.target,
		artifactPath: options.artifactPath,
		formalPlaybookPath,
	});
	budget.ledgerPath = ledgerPath;
	const appliedDemotions = applyAutonomousBudgetDemotions(budget, options.artifactPath ?? ledgerPath);
	writePrivateTextFile(
		path,
		[
			"# REPI Dispatcher Promotion Playbook",
			"",
			`Updated: ${timestamp}`,
			`Source artifact: ${options.artifactPath ?? "none"}`,
			`Target: ${options.target ?? "<none>"}`,
			`Ledger: ${ledgerPath}`,
			`Formal playbook: ${formalPlaybookPath ?? "none"}`,
			"",
			"## Autonomous execution budget",
			...autonomousBudgetLines(budget).map((item: any) => `- ${item}`),
			"",
			"## Score decay",
			...(budget.scoreDecay.length ? budget.scoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Historical score decay",
			...(budget.historicalScoreDecay.length
				? budget.historicalScoreDecay.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Repeated failure demotions",
			...(budget.demotionRules.length ? budget.demotionRules.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Applied lane demotions",
			...(appliedDemotions.length ? appliedDemotions.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## High-score promotions",
			...(budget.promotionRules.length ? budget.promotionRules.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Dispatcher learning hints",
			...(options.learningHints?.length ? options.learningHints.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Reusable next actions",
			...(budget.nextActions.length ? budget.nextActions.map((item: any) => `- ${item}`) : ["- none"]),
			"",
		].join("\n"),
	);
	return path;
}

export function reverseNextForBudgetPlaybook(routeOrBlob: string): string[] {
	return reverseDomainCaptureNextCommands({ routeOrBlob, includeGates: false });
}
