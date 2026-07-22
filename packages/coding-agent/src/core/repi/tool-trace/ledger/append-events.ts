/** Tool-trace call/result event builders. */
import { createHash } from "node:crypto";
import type { ToolCallTraceEventV1 } from "../../runtime-types/failure.ts";
import { truncateMiddle } from "../../text.ts";
import { stableJson, textBlocksToString, toolTraceHasLiteralSecret, toolTraceRedact } from "../pure.ts";
import { appendToolCallTraceEvent, buildToolTraceReplay } from "./append-core.ts";

export function appendToolCallTraceFromCall(event: any, missionId?: string): ToolCallTraceEventV1 {
	const input = (event.input ?? {}) as Record<string, unknown>;
	const rawInput = stableJson(input);
	const redactedInput = toolTraceRedact(rawInput);
	const commandPreviewRedacted =
		typeof input.command === "string" ? toolTraceRedact(input.command).slice(0, 1000) : undefined;
	const replay = buildToolTraceReplay(event.toolName, input, redactedInput);
	return appendToolCallTraceEvent({
		kind: "ToolCallTraceEventV1",
		schemaVersion: 1,
		eventId: `tooltrace:${event.toolCallId}:call`,
		ts: new Date().toISOString(),
		missionId,
		toolCallId: event.toolCallId,
		toolName: event.toolName,
		phase: "call",
		status: "running",
		inputSha256: createHash("sha256").update(rawInput).digest("hex"),
		inputPreviewRedacted: truncateMiddle(redactedInput, 1600),
		commandPreviewRedacted,
		replay,
		assertions: {
			toolCallIdPresent: Boolean(event.toolCallId),
			inputHashed: true,
			outputHashed: false,
			secretRedacted: !toolTraceHasLiteralSecret(redactedInput),
			replayHintPresent: replay.available,
			appendOnlyHashChain: true,
		},
	});
}

/** reverse: toolTraceRedact preserves proof_exit/bind_ready/partial_runtime_capture markers */
export function appendToolCallTraceFromResult(event: any, missionId?: string): ToolCallTraceEventV1 {
	const input = (event.input ?? {}) as Record<string, unknown>;
	const rawInput = stableJson(input);
	const redactedInput = toolTraceRedact(rawInput);
	const output = textBlocksToString(event.content);
	const redactedOutput = toolTraceRedact(output);
	const details = stableJson(event.details ?? {});
	const replay = buildToolTraceReplay(event.toolName, input, redactedInput);
	return appendToolCallTraceEvent({
		kind: "ToolCallTraceEventV1",
		schemaVersion: 1,
		eventId: `tooltrace:${event.toolCallId}:result`,
		ts: new Date().toISOString(),
		missionId,
		toolCallId: event.toolCallId,
		toolName: event.toolName,
		phase: "result",
		status: event.isError ? "error" : "pass",
		inputSha256: createHash("sha256").update(rawInput).digest("hex"),
		inputPreviewRedacted: truncateMiddle(redactedInput, 1600),
		commandPreviewRedacted:
			typeof input.command === "string" ? toolTraceRedact(input.command).slice(0, 1000) : undefined,
		outputSha256: createHash("sha256").update(output).digest("hex"),
		outputPreviewRedacted: truncateMiddle(redactedOutput, 1600),
		detailsSha256: createHash("sha256").update(details).digest("hex"),
		replay,
		assertions: {
			toolCallIdPresent: Boolean(event.toolCallId),
			inputHashed: true,
			outputHashed: true,
			secretRedacted: !toolTraceHasLiteralSecret(redactedInput) && !toolTraceHasLiteralSecret(redactedOutput),
			replayHintPresent: replay.available,
			appendOnlyHashChain: true,
		},
	});
}
