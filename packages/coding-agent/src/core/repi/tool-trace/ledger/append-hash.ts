/** Tool-trace ledger hash/cache helpers. */
import { readTextFile as readText, toolCallTraceLedgerPath, writePrivateTextFile } from "../../storage.ts";
import { latestToolTraceHashCache, toolTraceReportCache, toolTraceVerifyState } from "./cache.ts";

export function appendText(path: string, text: string): void {
	const prev = readText(path);
	writePrivateTextFile(path, prev ? `${prev}${prev.endsWith("\n") ? "" : "\n"}${text}` : text);
}

export function latestToolTraceHash(): string {
	const path = toolCallTraceLedgerPath();
	const cached = latestToolTraceHashCache.get(path);
	if (cached !== undefined) return cached;
	const text = readText(path).trim();
	if (!text) return "0".repeat(64);
	const lines = text.split(/\r?\n/).filter(Boolean);
	try {
		const row = JSON.parse(lines[lines.length - 1]) as { eventHash?: string };
		if (typeof row.eventHash === "string") {
			latestToolTraceHashCache.set(path, row.eventHash);
			return row.eventHash;
		}
		return "0".repeat(64);
	} catch {
		return "0".repeat(64);
	}
}

/** reverse: traced payloads may carry proof_exit/bind_ready for completion audit */
export function invalidateToolTraceReportCache(): void {
	toolTraceReportCache.clear();
	toolTraceVerifyState.depositsSinceFullTraceVerify = 0;
}
