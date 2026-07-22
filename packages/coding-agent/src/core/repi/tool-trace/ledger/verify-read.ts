/** Tool-trace ledger read/verify. */
/** Tool-trace ledger verify/report builders. */

import type { ToolCallTraceEventV1 } from "../../runtime-types/failure.ts";
import { readTextFile as readText, toolCallTraceLedgerPath } from "../../storage.ts";
import { uniqueNonEmpty } from "../../text.ts";
import { toolCallTraceHash, toolTraceHasLiteralSecret } from "../pure.ts";

export function readToolTraceEvents(): ToolCallTraceEventV1[] {
	return readText(toolCallTraceLedgerPath())
		.split(/\r?\n/)
		.filter(Boolean)
		.flatMap((line: any) => {
			try {
				return [JSON.parse(line) as ToolCallTraceEventV1];
			} catch {
				return [];
			}
		});
}

export function verifyToolCallTraceLedgerV1(events: ToolCallTraceEventV1[]): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	let prevHash = "0".repeat(64);
	const callIds = new Set<string>();
	for (const [index, event] of events.entries()) {
		if (event.kind !== "ToolCallTraceEventV1") errors.push(`tool_trace_kind_invalid:${index}`);
		if (event.prevHash !== prevHash) errors.push(`tool_trace_prev_hash_mismatch:${index}`);
		const { eventHash: _eventHash, ...withoutHash } = event;
		if (event.eventHash !== toolCallTraceHash(withoutHash)) errors.push(`tool_trace_event_hash_mismatch:${index}`);
		prevHash = event.eventHash;
		if (!event.toolCallId) errors.push(`tool_trace_missing_tool_call_id:${index}`);
		if (!event.inputSha256 || !/^[a-f0-9]{64}$/.test(event.inputSha256))
			errors.push(`tool_trace_input_hash_missing:${index}`);
		if (event.phase === "result" && (!event.outputSha256 || !/^[a-f0-9]{64}$/.test(event.outputSha256)))
			errors.push(`tool_trace_output_hash_missing:${index}`);
		if (
			!event.assertions.secretRedacted ||
			toolTraceHasLiteralSecret(`${event.inputPreviewRedacted}\n${event.outputPreviewRedacted ?? ""}`)
		)
			errors.push(`tool_trace_secret_not_redacted:${index}`);
		if (!event.replay.available && event.toolName === "bash") errors.push(`tool_trace_replay_missing:${index}`);
		if (event.phase === "call") callIds.add(event.toolCallId);
		if (event.phase === "result" && !callIds.has(event.toolCallId))
			errors.push(`tool_trace_result_without_call:${event.toolCallId}`);
	}
	return { ok: errors.length === 0, errors: uniqueNonEmpty(errors, 120) };
}
