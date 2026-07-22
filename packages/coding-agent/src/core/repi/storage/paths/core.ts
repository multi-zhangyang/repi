/** Core recon/report/tool/runtime path helpers. */
import { join } from "node:path";
import { getAgentDir } from "../../../../config.ts";
import { memoryPath } from "../../memory-stubs.ts";
import { evidenceToolCallsDir } from "./evidence-control.ts";
import { evidenceFailuresDir, evidenceRepairsDir } from "./evidence-reverse.ts";

export function reconDir(): string {
	return join(getAgentDir(), "recon");
}

export function reconArchiveDir(): string {
	return join(reconDir(), "archive");
}

export function compactResumeTransitionLedgerPath(): string {
	return memoryPath("compaction-resume-transitions.jsonl");
}

export function compactResumeLedgerV2ReportPath(): string {
	return memoryPath("compaction-resume-ledger-v2-report.json");
}

export function autonomousBudgetLedgerPath(): string {
	return memoryPath("autonomous-budget-ledger.md");
}

export function compactionResumeTelemetryPath(): string {
	return memoryPath("compaction-auto-resume-board.md");
}

export function missionPath(name: string): string {
	return join(reconDir(), "mission", name);
}

export function currentMissionPath(): string {
	return missionPath("current.json");
}

export function toolCallTraceLedgerPath(): string {
	return join(evidenceToolCallsDir(), "tool-call-trace.jsonl");
}

export function toolCallTraceReportPath(): string {
	return join(evidenceToolCallsDir(), "tool-call-trace-report.json");
}

export function runtimeFailureLedgerPath(): string {
	return join(evidenceFailuresDir(), "ledger.jsonl");
}

/**
 * Compact `{signature: count}` summary of the runtime-failure ledger. The
 * ledger itself is an append-only audit log (capped + rotated); this summary is
 * the O(1) source of truth for per-signature attempt counts used by the
 * "exhausted after maxAttempts" decision. Keeping counts here (not by scanning
 * the ledger) lets the ledger be safely rotated without resetting attempt
 * counts — and removes the O(n) per-failure scan of the growing ledger.
 */

export function runtimeFailureSummaryPath(): string {
	return join(evidenceFailuresDir(), "summary.json");
}

export function runtimeRepairQueuePath(): string {
	return join(evidenceRepairsDir(), "queue.jsonl");
}

export function reportDir(): string {
	return join(reconDir(), "reports");
}

export function builtinSkillFilePath(): string {
	return join(reconDir(), "builtin", "reverse-pentest-orchestrator", "SKILL.md");
}

export function builtinPromptFilePath(name: string): string {
	return join(reconDir(), "builtin", "prompts", `${name}.md`);
}

export function toolIndexPath(): string {
	return join(reconDir(), "tools", "tool-index.md");
}

export type RepiBuiltinPromptDefault = {
	name: string;
	description: string;
	argumentHint?: string;
	content: string;
};

export type RepiStorageDefaultsOptions = {
	skillContent?: string;
	prompts?: RepiBuiltinPromptDefault[];
	memoryEmbeddingProvider?: unknown;
};
