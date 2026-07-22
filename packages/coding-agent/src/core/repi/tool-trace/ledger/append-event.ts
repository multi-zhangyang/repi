/** Append a single tool-call trace event with reverse proof markers. */
import { ensureReconStorage } from "../../resources.ts";
import type { ToolCallTraceEventV1 } from "../../runtime-types/failure.ts";
import { toolCallTraceLedgerPath, toolCallTraceReportPath, writePrivateTextFile } from "../../storage.ts";
import { toolCallTraceHash, toolTraceRedact } from "../pure.ts";
import { appendText, latestToolTraceHash } from "./append-hash.ts";
import { rotateToolCallTraceLedgerIfNeeded } from "./append-rotate.ts";
import { latestToolTraceHashCache } from "./cache.ts";
import { statToolTraceLedger } from "./helpers.ts";
import { buildToolCallTraceLedgerV1Incremental, readToolTraceEvents, writeToolCallTraceReport } from "./verify.ts";

/** reverse: append may include proof_exit/bind_ready markers for claim gates */
export function appendToolCallTraceEvent(
	row: Omit<ToolCallTraceEventV1, "prevHash" | "eventHash">,
): ToolCallTraceEventV1 {
	ensureReconStorage();
	const prevHash = latestToolTraceHash();
	const withoutHash = { ...row, prevHash };
	const event: ToolCallTraceEventV1 = { ...withoutHash, eventHash: toolCallTraceHash(withoutHash) };
	const preStat = statToolTraceLedger();
	appendText(toolCallTraceLedgerPath(), `${JSON.stringify(event)}\n`);
	latestToolTraceHashCache.set(toolCallTraceLedgerPath(), event.eventHash);
	const incremental = buildToolCallTraceLedgerV1Incremental(event, preStat);
	if (incremental) {
		writePrivateTextFile(toolCallTraceReportPath(), `${JSON.stringify(incremental, null, 2)}\n`);
		return event;
	}
	const events = readToolTraceEvents();
	const rotated = rotateToolCallTraceLedgerIfNeeded(events);
	if (rotated) {
		latestToolTraceHashCache.set(
			toolCallTraceLedgerPath(),
			rotated[rotated.length - 1]?.eventHash ?? event.eventHash,
		);
		writeToolCallTraceReport();
	} else {
		writeToolCallTraceReport(events);
	}
	return event;
}

export function buildToolTraceReplay(
	toolName: string,
	input: Record<string, unknown>,
	redactedInput: string,
): ToolCallTraceEventV1["replay"] {
	const command = typeof input.command === "string" ? toolTraceRedact(input.command) : undefined;
	if (toolName === "bash" && command)
		return {
			available: true,
			command,
			redacted: true,
			deterministic: !/[<>]|\b(?:date|time|random|uuid|curl|wget)\b/i.test(command),
		};
	const action = typeof input.action === "string" ? input.action : undefined;
	return {
		available: Boolean(action || redactedInput),
		command: action ? `${toolName} ${action}` : undefined,
		redacted: true,
		deterministic: toolName !== "bash",
	};
}
