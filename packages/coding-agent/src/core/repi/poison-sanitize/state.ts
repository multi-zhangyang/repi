/** Sanitize recon poisoned state archive (memory/events/text). */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { atomicWriteFileSync } from "../../tools/atomic-write.ts";
import { sanitizeMemoryEventRow } from "../memory-deposition.ts";
import type { MemoryEventV1 } from "../memory-transaction.ts";
import { ensureReconStorage } from "../resources.ts";
import { artifactBasename, readTextFile as readText, reconArchiveDir, reconDir } from "../storage.ts";
import {
	buildMemoryStoreVerificationUnlocked,
	caseMemoryPath,
	containsRepiPoison,
	invalidateDepositionChainCache,
	memoryDepositionEventBusPath,
	memoryDepositionEventHash,
	memoryEventHash,
	memoryEventsPath,
	readMemoryDepositionEvents,
	readMemoryEvents,
	rebuildCaseMemoryFromEvents,
	writeFileAtomic,
} from "./config.ts";
import { sanitizeMemoryDepositionRow } from "./memory-row.ts";
import { redactRepiPoisonText } from "./text.ts";
import { poisonSanitizeTextPaths } from "./text-paths.ts";
export function sanitizeReconPoisonedState(): string {
	ensureReconStorage();
	const timestamp = new Date().toISOString();
	const archiveRoot = join(reconArchiveDir(), `poison-cleanup-${timestamp.replace(/[:.]/g, "-")}`);
	mkdirSync(archiveRoot, { recursive: true });
	const actions: string[] = [];
	const archiveOriginal = (path: string, text: string) => {
		const relative = path.startsWith(reconDir()) ? path.slice(reconDir().length + 1) : artifactBasename(path);
		const archived = join(archiveRoot, relative);
		mkdirSync(dirname(archived), { recursive: true });
		atomicWriteFileSync(archived, text, 0o644);
		return archived;
	};
	const rawEventsText = readText(memoryEventsPath());
	if (containsRepiPoison(rawEventsText)) {
		const archived = archiveOriginal(memoryEventsPath(), rawEventsText);
		let prevHash = "0".repeat(64);
		const cleanEvents = readMemoryEvents()
			.map(sanitizeMemoryEventRow)
			.filter((event: any): event is MemoryEventV1 => Boolean(event))
			.map((event: any, index: any) => {
				const row: MemoryEventV1 = { ...event, seq: index + 1, prevHash, entryHash: "" };
				(row as any).entryHash = memoryEventHash(row);
				prevHash = (row as any).entryHash;
				return row;
			});
		writeFileAtomic(
			memoryEventsPath(),
			cleanEvents.length ? `${cleanEvents.map((event: any) => JSON.stringify(event)).join("\n")}\n` : "",
		);
		const cases = rebuildCaseMemoryFromEvents(cleanEvents);
		writeFileAtomic(
			caseMemoryPath(),
			cases.length ? `${cases.map((row: any) => JSON.stringify(row)).join("\n")}\n` : "",
		);
		actions.push(`memory_events_sanitized archived=${archived} kept=${cleanEvents.length}`);
	}
	const rawDepositionText = readText(memoryDepositionEventBusPath());
	if (containsRepiPoison(rawDepositionText)) {
		const archived = archiveOriginal(memoryDepositionEventBusPath(), rawDepositionText);
		let prevHash = "0".repeat(64);
		const cleanRows = readMemoryDepositionEvents()
			.map(sanitizeMemoryDepositionRow)
			.filter((event: any): event is any => Boolean(event))
			.map((event: any, index: any) => {
				const rowBase: Omit<any, "entryHash"> = {
					...event,
					seq: index + 1,
					prevHash,
				};
				const row: any = {
					...rowBase,
					entryHash: memoryDepositionEventHash({ ...rowBase, entryHash: "" }),
				};
				prevHash = (row as any).entryHash;
				return row;
			});
		writeFileAtomic(
			memoryDepositionEventBusPath(),
			cleanRows.length ? `${cleanRows.map((event: any) => JSON.stringify(event)).join("\n")}\n` : "",
		);
		invalidateDepositionChainCache();
		actions.push(`memory_deposition_sanitized archived=${archived} kept=${cleanRows.length}`);
	}
	const textPaths = poisonSanitizeTextPaths();
	for (const path of textPaths) {
		const text = readText(path);
		if (!containsRepiPoison(text)) continue;
		const archived = archiveOriginal(path, text);
		writeFileAtomic(path, redactRepiPoisonText(text));
		actions.push(`text_redacted path=${path} archived=${archived}`);
	}
	buildMemoryStoreVerificationUnlocked({ write: true });
	return [
		"memory_sanitize:",
		`archive_root: ${archiveRoot}`,
		...(actions.length ? actions.map((action: any) => `- ${action}`) : ["- no poison markers found"]),
		// reverse: after poison cleanup, re-check proof exit / domain gates before claim
		"next: re_evidence digest && re_domain_proof_exit show && re_complete audit",
	].join("\n");
}
