import { evidenceLedgerPath } from "../storage.ts";
import type { AppendEvidenceOptions, EvidenceKind, EvidenceRecord } from "./types.ts";

export function evidencePriority(kind: EvidenceKind): number {
	switch (kind) {
		case "runtime":
			return 1;
		case "traffic":
			return 2;
		case "served_asset":
			return 3;
		case "process_config":
			return 4;
		case "artifact":
			return 5;
		case "source":
			return 6;
		case "note":
			return 7;
	}
}

export function formatEvidenceRecord(record: EvidenceRecord): string {
	return [
		`## ${record.timestamp} — P${record.priority} — ${record.kind} — ${record.title}`,
		"",
		`- fact: ${record.fact}`,
		record.command ? `- command: \`${record.command.replace(/`/g, "\\`")}\`` : undefined,
		record.path ? `- path: ${record.path}` : undefined,
		record.offset ? `- offset: ${record.offset}` : undefined,
		record.hash ? `- hash: ${record.hash}` : undefined,
		record.verify ? `- verify: ${record.verify}` : undefined,
		record.confidence ? `- confidence: ${record.confidence}` : undefined,
		...(record.query
			? Object.entries(record.query)
					.slice(0, 16)
					.map(([k, v]) => `- query.${k}: ${v}`)
			: []),
		...(record.meta?.length ? record.meta.slice(0, 12).map((item: any) => `- meta: ${item}`) : []),
		"",
	]
		.filter((line): line is string => line !== undefined)
		.join("\n");
}

export function appendEvidenceRecord(
	record: Omit<EvidenceRecord, "timestamp" | "priority"> & { priority?: number },
	options: AppendEvidenceOptions,
): EvidenceRecord {
	options.ensureStorage?.();
	const full: EvidenceRecord = {
		timestamp: (options.now?.() ?? new Date()).toISOString(),
		...record,
		priority: record.priority ?? evidencePriority(record.kind),
	};
	options.appendText(evidenceLedgerPath(), formatEvidenceRecord(full));
	options.onLedgerUpdated?.(full);
	return full;
}
