/** REPI storage default seed files for ensureRepiStorage. */
import { evidenceLedgerPath, toolCallTraceLedgerPath, toolCallTraceReportPath, toolIndexPath } from "../paths.ts";
import { repiStorageMemoryDefaultEntries } from "./layout-defaults-memory.ts";

export function repiStorageDefaultFiles(
	options: { memoryEmbeddingProvider?: Record<string, unknown> } = {},
): Map<string, string> {
	const memoryEmbeddingProvider = options.memoryEmbeddingProvider ?? {
		kind: "repi-memory-embedding-provider",
		schemaVersion: 1,
		backend: "local-hash",
		status: "ready",
	};
	return new Map<string, string>([
		...repiStorageMemoryDefaultEntries(memoryEmbeddingProvider),
		[toolCallTraceLedgerPath(), ""],
		[
			toolCallTraceReportPath(),
			`${JSON.stringify({ kind: "ToolCallTraceLedgerV1", schemaVersion: 1, tool_call_observability_runtime: true, append_only_tool_trace: true, replayable_tool_result_hashes: true, secret_redaction_required: true, eventCount: 0, callCount: 0, resultCount: 0, errorCount: 0, hashChainOk: true, secretRedactionOk: true, replayCoverage: 0, events: [] }, null, 2)}\n`,
		],
		[evidenceLedgerPath(), "# REPI Evidence Ledger\n\n"],
		[toolIndexPath(), "# REPI Tool Index\n\n"],
	]);
}
