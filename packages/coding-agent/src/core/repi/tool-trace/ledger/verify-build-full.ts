/** Tool-trace ledger full build/commit/write. */

import type { ToolCallTraceEventV1, ToolCallTraceLedgerV1 } from "../../runtime-types/failure.ts";
import { toolCallTraceLedgerPath, toolCallTraceReportPath, writePrivateTextFile } from "../../storage.ts";
import { toolTraceReportCache } from "./cache.ts";
import { statToolTraceLedger } from "./helpers.ts";
import { readToolTraceEvents, verifyToolCallTraceLedgerV1 } from "./verify-read.ts";

export function buildToolCallTraceLedgerV1(events = readToolTraceEvents()): ToolCallTraceLedgerV1 {
	const validation = verifyToolCallTraceLedgerV1(events);
	const resultCount = events.filter((event: any) => event.phase === "result").length;
	const replayCovered = events.filter((event: any) => event.replay.available).length;
	return {
		kind: "ToolCallTraceLedgerV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		ledgerPath: toolCallTraceLedgerPath(),
		eventCount: events.length,
		callCount: events.filter((event: any) => event.phase === "call").length,
		resultCount,
		errorCount: events.filter((event: any) => event.status === "error").length,
		hashChainOk: validation.ok,
		secretRedactionOk: !events.some((event: any) => !event.assertions.secretRedacted),
		replayCoverage: events.length ? replayCovered / events.length : 0,
		events: events.slice(-40),
	};
}

export function commitToolTraceReportCache(events: ToolCallTraceEventV1[], report: ToolCallTraceLedgerV1): void {
	const path = toolCallTraceLedgerPath();
	const st = statToolTraceLedger();
	if (!st) {
		toolTraceReportCache.delete(path);
		return;
	}
	const callIds = new Set<string>();
	for (const event of events) if (event.phase === "call") callIds.add(event.toolCallId);
	const replayCovered = events.filter((event: any) => event.replay.available).length;
	const lastEventHash = events.length ? events[events.length - 1].eventHash : "0".repeat(64);
	toolTraceReportCache.set(path, {
		mtimeMs: st.mtimeMs,
		size: st.size,
		report,
		callIds,
		replayCovered,
		lastEventHash,
	});
}

// opt #79 — build the post-append report from the cached prior report + the ONE new
// event, verifying ONLY the new event's chain linkage + per-event checks (mirrors
// verifyToolCallTraceLedgerV1's per-row checks applied to the tail) + updating the
// count fields arithmetically. Returns null on ANY doubt → caller falls back to the
// full parse+walk (buildToolCallTraceLedgerV1). The incremental report is field-
// identical to the full report (same counts/flags/events.slice(-40); only generatedAt
// differs, which is always fresh). Never silently weakens: every doubt → full walk.

export function writeToolCallTraceReport(
	events: ToolCallTraceEventV1[] = readToolTraceEvents(),
): ToolCallTraceLedgerV1 {
	const report = buildToolCallTraceLedgerV1(events);
	// Atomic (opt #208): temp+rename 0o600 via writePrivateTextFile — see the
	// incremental-write note above; a torn writeFileSync would leave a truncated
	// tool-call-trace report. Matches the ledger atomic write (#48).
	writePrivateTextFile(toolCallTraceReportPath(), `${JSON.stringify(report, null, 2)}\n`);
	// opt #79 — populate the incremental cache from the full build (the post-append
	// or post-rotation stat is captured inside commitToolTraceReportCache).
	commitToolTraceReportCache(events, report);
	return report;
}
