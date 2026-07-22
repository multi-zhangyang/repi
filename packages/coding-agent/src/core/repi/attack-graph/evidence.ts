/** Attack-graph evidence ledger parsing helpers. */

import { evidenceLedgerPath, readTextFile as readText } from "../storage.ts";
import { slug } from "../text.ts";
import type { EvidenceLedgerTaskRecord } from "./types.ts";

export function evidenceLedgerBullet(block: string, key: string): string | undefined {
	const match = new RegExp(`^- ${key}: (.+)$`, "m").exec(block);
	return match?.[1]?.trim();
}

export function evidenceLedgerCommand(block: string): string | undefined {
	const match = /^- command: `((?:\\`|[^`])*)`$/m.exec(block);
	return match?.[1]?.replace(/\\`/g, "`").trim();
}

export function evidenceRecordHasCounterSignal(record: EvidenceLedgerTaskRecord): boolean {
	return /counter[_ -]?evidence|contradict|refut|negative|no[-_ ]?match|not reproduced|failed|blocked|error|反证|矛盾|失败|未复现/i.test(
		[record.title, record.fact, record.confidence, record.verify].filter(Boolean).join("\n"),
	);
}

export function evidenceRecordHasHypothesisSignal(record: EvidenceLedgerTaskRecord): boolean {
	const queryText = record.query
		? Object.entries(record.query)
				.map(([k, v]) => `${k}=${v}`)
				.join("\n")
		: "";
	const metaText = (record.meta ?? []).join("\n");
	// Reverse technique/mitre/cwe query fields count as structured hypothesis/claim anchors.
	if (record.query && (record.query.technique || record.query.mitre || record.query.cwe || record.query.proof_exit)) {
		return true;
	}
	return /hypothesis|claim|candidate|suspect|assumption|assertion|proof|finding|technique|mitre|cwe|假设|候选|断言|发现/i.test(
		[record.title, record.fact, record.confidence, queryText, metaText].filter(Boolean).join("\n"),
	);
}

export function evidenceLedgerQueryFields(block: string): Record<string, string> | undefined {
	const out: Record<string, string> = {};
	for (const line of block.split("\n")) {
		const m = /^- query\.([A-Za-z0-9_.-]+):\s*(.+)$/.exec(line.trim());
		if (!m) continue;
		out[m[1]] = m[2].trim();
	}
	return Object.keys(out).length ? out : undefined;
}

export function evidenceLedgerMetaFields(block: string): string[] | undefined {
	const rows = block
		.split("\n")
		.map((line: any) => /^- meta:\s*(.+)$/.exec(line.trim())?.[1]?.trim())
		.filter((item): item is string => Boolean(item));
	return rows.length ? rows.slice(0, 16) : undefined;
}

export function parseEvidenceLedgerTaskRecords(limit = 14): EvidenceLedgerTaskRecord[] {
	const text = readText(evidenceLedgerPath());
	const blocks = text
		.split(/^##\s+/m)
		.filter((block: any) => block.trim())
		.map((block: any) => `## ${block}`);
	const tail = blocks.slice(-limit);
	return tail.flatMap((block, index) => {
		const header = /^##\s+(.+?)\s+—\s+P(\d+)\s+—\s+(.+?)\s+—\s+(.+)$/m.exec(block);
		if (!header) return [];
		const title = header[4]?.trim() ?? "evidence";
		return [
			{
				index,
				evidenceId: `evidence:${index}:${slug(title)}`,
				timestamp: header[1]?.trim() ?? "",
				priority: Number.parseInt(header[2] ?? "7", 10),
				kind: header[3]?.trim() ?? "note",
				title,
				fact: evidenceLedgerBullet(block, "fact"),
				command: evidenceLedgerCommand(block),
				path: evidenceLedgerBullet(block, "path"),
				hash: evidenceLedgerBullet(block, "hash"),
				verify: evidenceLedgerBullet(block, "verify"),
				confidence: evidenceLedgerBullet(block, "confidence"),
				query: evidenceLedgerQueryFields(block),
				meta: evidenceLedgerMetaFields(block),
			} satisfies EvidenceLedgerTaskRecord,
		];
	});
}
