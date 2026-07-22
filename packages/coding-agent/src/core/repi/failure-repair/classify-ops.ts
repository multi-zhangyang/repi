/** Failure-repair ledger/queue rotation and matching helpers. */
import {
	readTextFile as readText,
	runtimeFailureLedgerPath,
	runtimeFailureSummaryPath,
	runtimeRepairQueuePath,
	writePrivateTextFile,
} from "../storage.ts";
import { readRuntimeFailureLedgerRows, readRuntimeFailureSummary, readRuntimeRepairQueueRows } from "./ledger-read.ts";
import type { RuntimeFailureCategory, RuntimeFailureStatus, RuntimeRepairAction } from "./types.ts";
export function appendText(path: string, text: string): void {
	const prev = readText(path);
	const sep = prev && !prev.endsWith("\n") ? "\n" : "";
	writePrivateTextFile(path, prev ? `${prev}${sep}${text}` : text);
}
export function runtimeFailureLedgerMaxRows(): number {
	const raw = process.env.REPI_FAILURE_LEDGER_MAX_ROWS;
	if (raw === undefined) return 500;
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 0 ? n : 500; // 0 = disable rotation
}
// Cap the on-disk failure ledger to its tail so an unbounded append-only audit
// log does not grow across sessions. Safe because per-signature attempt counts
// live in the summary map (not the ledger), so dropping old rows does NOT reset
// the "exhausted after maxAttempts" decision — only the audit history window
// shrinks, which is what a recent-failure report shows anyway.
export function runtimeRepairQueueMaxRows(): number {
	const raw = process.env.REPI_REPAIR_QUEUE_MAX_ROWS;
	if (raw === undefined) return 500;
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 0 ? n : 500; // 0 = disable rotation
}
export function runtimeRepairAction(category: RuntimeFailureCategory, reason: string): RuntimeRepairAction {
	if (category === "tool_missing") return "refresh-context";
	if (category === "artifact_stale" || /unresolved|placeholder|recapture|map/i.test(reason))
		return "recapture-evidence";
	if (/budget|coverage|claim|supervisor|escalat/i.test(reason)) return "escalate";
	if (category === "contract_gap") return "replace-command";
	return "rerun";
}
export function bumpRuntimeFailureSummary(signatures: string[]): void {
	if (!signatures.length) return;
	const summary = readRuntimeFailureSummary();
	for (const signature of signatures) summary.set(signature, (summary.get(signature) ?? 0) + 1);
	writePrivateTextFile(runtimeFailureSummaryPath(), JSON.stringify(Object.fromEntries(summary)));
}
export function runtimeFailureAttempt(signature: string): number {
	const summary = readRuntimeFailureSummary();
	return (summary.get(signature) ?? 0) + 1;
}
export function rotateRuntimeFailureLedgerIfNeeded(): void {
	const maxRows = runtimeFailureLedgerMaxRows();
	if (maxRows <= 0) return;
	const rows = readRuntimeFailureLedgerRows();
	if (rows.length <= maxRows) return;
	const kept = rows.slice(-maxRows);
	writePrivateTextFile(runtimeFailureLedgerPath(), `${kept.map((row: any) => JSON.stringify(row)).join("\n")}\n`);
}
export function rotateRuntimeRepairQueueIfNeeded(): void {
	const maxRows = runtimeRepairQueueMaxRows();
	if (maxRows <= 0) return;
	const rows = readRuntimeRepairQueueRows();
	if (rows.length <= maxRows) return;
	const kept = rows.slice(-maxRows);
	writePrivateTextFile(runtimeRepairQueuePath(), `${kept.map((row: any) => JSON.stringify(row)).join("\n")}\n`);
}
export function runtimeFailurePriority(status: RuntimeFailureStatus): number {
	if (status === "exhausted") return 5;
	if (status === "blocked") return 4;
	if (status === "repair_queued") return 3;
	if (status === "failed") return 2;
	if (status === "rolled_back") return 1;
	return 0;
}
export function runtimeFailureTargetMatches(failure: any, target?: string): boolean {
	if (!target) return true;
	const needle = target.toLowerCase();
	return [
		failure.scope,
		...(failure.failedChecks ?? []),
		...(failure.blockedConditions ?? []).flatMap((condition: any) => [condition.reason, condition.unblock]),
		...(failure.artifactHashes ?? []).map((artifact: any) => artifact.path),
	]
		.filter(Boolean)
		.some((item: any) => item.toLowerCase().includes(needle));
}
export function runtimeRepairTargetMatches(repair: any, target?: string): boolean {
	if (!target) return true;
	const needle = target.toLowerCase();
	return [
		repair.scope,
		...(repair.commands ?? []),
		...(repair.expectedArtifacts ?? []),
		...(repair.expectedChecks ?? []),
		...(repair.blockedConditions ?? []).flatMap((condition: any) => [condition.reason, condition.unblock]),
	]
		.filter(Boolean)
		.some((item: any) => item.toLowerCase().includes(needle));
}
export function rebuildRuntimeFailureSummaryFromLedger(): Map<string, number> {
	const map = new Map<string, number>();
	for (const row of readRuntimeFailureLedgerRows()) {
		map.set(row.signature, (map.get(row.signature) ?? 0) + 1);
	}
	writePrivateTextFile(runtimeFailureSummaryPath(), JSON.stringify(Object.fromEntries(map)));
	return map;
}
