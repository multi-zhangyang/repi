/** Tool-trace ledger incremental build. */

import type { ToolCallTraceEventV1, ToolCallTraceLedgerV1 } from "../../runtime-types/failure.ts";
import { toolCallTraceLedgerPath } from "../../storage.ts";
import { toolCallTraceHash, toolTraceFullVerifyEvery, toolTraceHasLiteralSecret } from "../pure.ts";
import { toolTraceReportCache, toolTraceVerifyState } from "./cache.ts";
import { statToolTraceLedger, toolCallTraceLedgerMaxRows } from "./helpers.ts";

export function buildToolCallTraceLedgerV1Incremental(
	newEvent: ToolCallTraceEventV1,
	preStat: { mtimeMs: number; size: number } | null,
): ToolCallTraceLedgerV1 | null {
	const path = toolCallTraceLedgerPath();
	const cached = toolTraceReportCache.get(path);
	if (!cached || !preStat) return null;
	// External edit between the cached verify and this append → miss → full walk.
	if (cached.mtimeMs !== preStat.mtimeMs || cached.size !== preStat.size) return null;
	// Prior chain wasn't clean → re-walk from genesis to surface the error.
	if (!cached.report.hashChainOk) return null;
	// Rotation would change the head + re-hash the tail → the cached counts/callIds
	// no longer apply → full path (rotation re-reads + rewrites + re-caches).
	const maxRows = toolCallTraceLedgerMaxRows();
	if (maxRows > 0 && cached.report.eventCount + 1 > maxRows) return null;
	// Periodic safety net: every K appends, force a full walk to bound the residual
	// middle-row-tampering window (same doctrine as #78's REPI_MEMORY_FULL_VERIFY_EVERY).
	const fullVerifyEvery = toolTraceFullVerifyEvery();
	toolTraceVerifyState.depositsSinceFullTraceVerify += 1;
	if (fullVerifyEvery > 0 && toolTraceVerifyState.depositsSinceFullTraceVerify >= fullVerifyEvery) {
		toolTraceVerifyState.depositsSinceFullTraceVerify = 0;
		return null;
	}
	// Verify the ONE new event (the per-row checks from verifyToolCallTraceLedgerV1).
	const errors: string[] = [];
	if (newEvent.kind !== "ToolCallTraceEventV1") errors.push("tool_trace_kind_invalid:tail");
	if (newEvent.prevHash !== cached.lastEventHash) errors.push("tool_trace_prev_hash_mismatch:tail");
	const { eventHash: _eventHash, ...withoutHash } = newEvent;
	if (newEvent.eventHash !== toolCallTraceHash(withoutHash)) errors.push("tool_trace_event_hash_mismatch:tail");
	if (!newEvent.toolCallId) errors.push("tool_trace_missing_tool_call_id:tail");
	if (!newEvent.inputSha256 || !/^[a-f0-9]{64}$/.test(newEvent.inputSha256))
		errors.push("tool_trace_input_hash_missing:tail");
	if (newEvent.phase === "result" && (!newEvent.outputSha256 || !/^[a-f0-9]{64}$/.test(newEvent.outputSha256)))
		errors.push("tool_trace_output_hash_missing:tail");
	if (
		!newEvent.assertions.secretRedacted ||
		toolTraceHasLiteralSecret(`${newEvent.inputPreviewRedacted}\n${newEvent.outputPreviewRedacted ?? ""}`)
	)
		errors.push("tool_trace_secret_not_redacted:tail");
	if (!newEvent.replay.available && newEvent.toolName === "bash") errors.push("tool_trace_replay_missing:tail");
	const callIds = new Set(cached.callIds);
	if (newEvent.phase === "call") callIds.add(newEvent.toolCallId);
	if (newEvent.phase === "result" && !callIds.has(newEvent.toolCallId))
		errors.push(`tool_trace_result_without_call:${newEvent.toolCallId}`);
	if (errors.length > 0) {
		toolTraceVerifyState.depositsSinceFullTraceVerify = 0;
		return null; // new-event check failure → full walk (never silently weaken)
	}
	const eventCount = cached.report.eventCount + 1;
	const replayCovered = cached.replayCovered + (newEvent.replay.available ? 1 : 0);
	const report: ToolCallTraceLedgerV1 = {
		kind: "ToolCallTraceLedgerV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		ledgerPath: path,
		eventCount,
		callCount: cached.report.callCount + (newEvent.phase === "call" ? 1 : 0),
		resultCount: cached.report.resultCount + (newEvent.phase === "result" ? 1 : 0),
		errorCount: cached.report.errorCount + (newEvent.status === "error" ? 1 : 0),
		hashChainOk: true,
		secretRedactionOk: cached.report.secretRedactionOk && newEvent.assertions.secretRedacted,
		replayCoverage: eventCount ? replayCovered / eventCount : 0,
		events: [...cached.report.events, newEvent].slice(-40),
	};
	// Commit with the POST-append stat (the append just bumped mtime+size) so the
	// NEXT append's pre-stat matches → next incremental hits.
	const fresh = statToolTraceLedger();
	if (fresh)
		toolTraceReportCache.set(path, {
			mtimeMs: fresh.mtimeMs,
			size: fresh.size,
			report,
			callIds,
			replayCovered,
			lastEventHash: newEvent.eventHash,
		});
	else toolTraceReportCache.delete(path);
	return report;
}
