/** Autonomous budget ledger writer. */
/** Autonomous budget ledger/playbook writers. */

import type { AutonomousExecutionBudget } from "../operator-format.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { autonomousBudgetLedgerPath, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { updateMissionCheckpoint } from "./deps.ts";

export function writeAutonomousBudgetLedger(params: {
	budget: AutonomousExecutionBudget;
	timestamp: string;
	target?: string;
	artifactPath?: string;
	formalPlaybookPath?: string;
}): string {
	ensureReconStorage();
	const path = autonomousBudgetLedgerPath();
	const header = "# REPI Autonomous Budget Ledger\n\n";
	const previous = readText(path, header);
	const turn = [
		`## Turn ${params.timestamp}`,
		`target=${params.target ?? "<none>"}`,
		`artifact=${params.artifactPath ?? "none"}`,
		`budget=max_turns:${params.budget.maxTurns},max_dispatch:${params.budget.maxDispatch},max_proof_loops:${params.budget.maxProofLoops},max_worker_retries:${params.budget.maxWorkerRetries}`,
		params.formalPlaybookPath ? `formal_playbook=${params.formalPlaybookPath}` : undefined,
		"### Score decay",
		...(params.budget.scoreDecay.length ? params.budget.scoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
		"### Demotions",
		...(params.budget.demotionRules.length
			? params.budget.demotionRules.map((item: any) => `- ${item}`)
			: ["- none"]),
		"### Promotions",
		...(params.budget.promotionRules.length
			? params.budget.promotionRules.map((item: any) => `- ${item}`)
			: ["- none"]),
		"### Next actions",
		...(() => {
			const actions = [...params.budget.nextActions];
			const reverseHeavy =
				/proof_exit|pending_runtime_capture|bind_ready|native|pwn|malware|firmware|reverse|binary|exploit/i.test(
					[
						...params.budget.scoreDecay,
						...params.budget.demotionRules,
						...params.budget.promotionRules,
						...actions,
					].join("\n"),
				);
			if (reverseHeavy) {
				for (const cmd of reverseDomainCaptureNextCommands({
					routeOrBlob: [
						...params.budget.scoreDecay,
						...params.budget.demotionRules,
						...params.budget.promotionRules,
						...actions,
					].join("\n"),
				}).slice(0, 4)) {
					if (!actions.includes(cmd)) actions.push(cmd);
				}
				for (const cmd of ["re_domain_proof_exit show", "re_complete audit"]) {
					if (!actions.includes(cmd)) actions.push(cmd);
				}
			}
			return actions.length ? actions.map((item: any) => `- ${item}`) : ["- none"];
		})(),
		"",
	]
		.filter((item): item is string => Boolean(item))
		.join("\n");
	const combined = `${previous.endsWith("\n") ? previous : `${previous}\n`}${turn}`;
	const lines = combined.split("\n");
	const trimmed = lines.length > 1200 ? [header.trimEnd(), ...lines.slice(-1150)].join("\n") : combined;
	// Atomic temp+rename (0o600): read-modify-write of the whole ledger; a torn
	// writeFileSync empties/truncates it and latestAutonomousBudgetLedger next turn
	// sees "" → dispatcher loses its failure-history signal (cold-start routing).
	// #43/#103.
	writePrivateTextFile(path, trimmed.endsWith("\n") ? trimmed : `${trimmed}\n`);
	updateMissionCheckpoint("autonomous_budget_ready", "done", path);
	return path;
}
