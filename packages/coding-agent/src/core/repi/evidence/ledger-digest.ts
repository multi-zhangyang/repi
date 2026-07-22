import { existsSync, statSync } from "node:fs";
import { buildContextDigest, latestContextPackArtifactPath } from "../context-pack/index-resolve.ts";
import { memoryTargetScope } from "../memory-stubs.ts";
import { evidenceLedgerPath } from "../storage.ts";
import { envBoolean } from "../text.ts";
import { readTextFile, slug, truncateMiddle } from "./io.ts";
import { lineCount } from "./io-lines.ts";
import type { EvidenceGraphNode, EvidenceIoOptions, EvidenceRuntimeDeps } from "./types.ts";

export function buildEvidenceDigest(query?: string, options: EvidenceIoOptions = {}): string {
	options.ensureStorage?.();
	const readText = options.readText ?? readTextFile;
	const truncate = options.truncate ?? truncateMiddle;
	const text = readText(evidenceLedgerPath()).trim();
	if (!text) return "证据 ledger 为空；用 re_evidence append 记录 runtime/traffic/source 等证据。";
	if (!query) return truncate(text, 6000);
	const lower = query.toLowerCase();
	const lines = text
		.split(/\r?\n/)
		.filter((line: any) => line.toLowerCase().includes(lower))
		.slice(-160);
	return lines.length ? lines.join("\n") : "No matching evidence lines";
}

export function buildStartupEvidenceDigest(
	options: EvidenceIoOptions & { target?: string; autoInject?: boolean } = {},
): string {
	options.ensureStorage?.();
	if (options.autoInject === true) return buildEvidenceDigest(options.target, options);
	const path = evidenceLedgerPath();
	const rows = lineCount(path);
	const bytes = existsSync(path) ? statSync(path).size : 0;
	return [
		"evidence_startup_isolation:",
		"historical_evidence_ledger=not_injected_by_default",
		`ledger_path=${path}`,
		`ledger_rows=${rows}`,
		`ledger_bytes=${bytes}`,
		"manual_recall:",
		"- re_evidence show",
		"- re_evidence show <query>",
		"opt_in:",
		"- set REPI_EVIDENCE_AUTO_INJECT=1 for legacy startup evidence injection",
	].join("\n");
}

export function buildContextEvidenceTail(
	options: EvidenceIoOptions & { target?: string; autoContextPack?: boolean } = {},
): string {
	const truncate = options.truncate ?? truncateMiddle;
	if (options.autoContextPack === true) return truncate(buildEvidenceDigest(undefined, options), 7000);
	if (options.target) {
		const scoped = buildEvidenceDigest(options.target, options);
		if (scoped && scoped !== "No matching evidence lines" && !scoped.startsWith("证据 ledger 为空")) {
			return truncate(scoped, 7000);
		}
	}
	return buildStartupEvidenceDigest(options);
}

export function evidenceLedgerGraphNodes(
	limit = 14,
	options: Pick<EvidenceIoOptions, "readText"> = {},
): EvidenceGraphNode[] {
	const readText = options.readText ?? readTextFile;
	const text = readText(evidenceLedgerPath());
	const records = [...text.matchAll(/^##\s+(.+?)\s+—\s+P(\d+)\s+—\s+(.+?)\s+—\s+(.+)$/gm)].slice(-limit);
	return records.map((match: any, index: any) => ({
		id: `evidence:${index}:${slug(match[4] ?? "evidence")}`,
		kind: "evidence",
		label: match[4]?.trim() ?? "evidence",
		status: match[3]?.trim(),
		priority: Number.parseInt(match[2] ?? "7", 10),
		note: match[1]?.trim(),
	}));
}
export function buildStartupContextDigest(options: { route?: string; target?: string } = {}): string {
	const latest = latestContextPackArtifactPath();
	if (envBoolean("REPI_CONTEXT_AUTO_INJECT") === true) return buildContextDigest(3000);
	return [
		"context_startup_isolation:",
		"historical_context_pack=not_injected_by_default",
		`latest_context_pack=${latest ?? "none"}`,
		`route=${options.route ?? "none"}`,
		`target_scope=${options.target ? memoryTargetScope(options.target) : "workspace"}`,
		"manual_resume:",
		"- re_context show",
		"- re_context resume <ref>",
		"opt_in:",
		"- set REPI_CONTEXT_AUTO_INJECT=1 for legacy startup context injection",
	].join("\n");
}

const _evidenceRuntimeDeps: EvidenceRuntimeDeps | null = null;
