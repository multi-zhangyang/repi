/** Rotate tool-call trace ledger when over max rows. */

import type { ToolCallTraceEventV1 } from "../../runtime-types/failure.ts";
import { toolCallTraceLedgerPath, writePrivateTextFile } from "../../storage.ts";
import { toolCallTraceHash } from "../pure.ts";
import { toolCallTraceLedgerMaxRows } from "./helpers.ts";
import { readToolTraceEvents } from "./verify.ts";

export function rotateToolCallTraceLedgerIfNeeded(
	events: ToolCallTraceEventV1[] = readToolTraceEvents(),
): ToolCallTraceEventV1[] | null {
	const maxRows = toolCallTraceLedgerMaxRows();
	if (maxRows <= 0) return null;
	if (events.length <= maxRows) return null;
	let kept = events.slice(-maxRows);
	while (kept.length > 0 && kept[0].phase === "result") {
		kept = kept.slice(1);
	}
	if (kept.length === 0) return null;
	let prevHash = "0".repeat(64);
	const rotated: ToolCallTraceEventV1[] = [];
	for (const event of kept) {
		const { eventHash: _omit, ...withoutHash } = event;
		const rebuilt = { ...withoutHash, prevHash };
		const newEventHash = toolCallTraceHash(rebuilt);
		rotated.push({ ...rebuilt, eventHash: newEventHash });
		prevHash = newEventHash;
	}
	const body = `${rotated.map((event: any) => JSON.stringify(event)).join("\n")}\n`;
	writePrivateTextFile(toolCallTraceLedgerPath(), body);
	return rotated;
}
