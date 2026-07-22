/** Context-pack resolve/parse/latest helpers. */
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { latestReconCompactionResumeTelemetry } from "../compact-resume/telemetry-io.ts";
import { memoryPath } from "../memory-stubs.ts";
import { evidenceContextsDir, readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { scopedContextArtifactIndex } from "./artifact-index.ts";
import { buildContextPack } from "./build.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";
import { contextPackReferenceMatches } from "./index-paths.ts";
import type { ContextPackArtifact, ContextResumeVerification } from "./types.ts";
import type { ContextArtifactIndexEntry } from "./types-index.ts";
import { writeContextPackArtifact } from "./write.ts";

export function resolveContextPackPathByRef(ref?: string): {
	path?: string;
	loadedBy: ContextResumeVerification["loadedBy"];
} {
	const trimmed = ref?.trim();
	if (trimmed) {
		const direct = [trimmed, join(process.cwd(), trimmed)].find((candidate: any) => existsSync(candidate));
		if (direct) return { path: direct, loadedBy: "contextPath" };
		const telemetry = latestReconCompactionResumeTelemetry().telemetry;
		if (
			telemetry?.contextPath &&
			(telemetry.compactionEntryId === trimmed ||
				telemetry.contextPath.includes(trimmed) ||
				trimmed.includes(telemetry.contextPath))
		)
			return { path: telemetry.contextPath, loadedBy: "compactionEntryId" };
		const ledgerRows = readText(memoryPath("compaction-resume-ledger.jsonl"))
			.split(/\r?\n/)
			.map((line: any) => {
				try {
					return JSON.parse(line) as {
						contextPath?: string;
						contractId?: string;
						idempotencyKey?: string;
						entryHash?: string;
					};
				} catch {
					return undefined;
				}
			})
			.filter(
				(row): row is { contextPath?: string; contractId?: string; idempotencyKey?: string; entryHash?: string } =>
					Boolean(row?.contextPath),
			)
			.reverse();
		for (const row of ledgerRows) {
			if (
				[row.contextPath, row.contractId, row.idempotencyKey, row.entryHash].some((item: any) =>
					item?.includes(trimmed),
				)
			)
				return { path: row.contextPath, loadedBy: "compactionEntryId" };
		}
		for (const path of recentMarkdownArtifacts(evidenceContextsDir(), 50)) {
			const pack = parseContextPackArtifact(path);
			if (pack && contextPackReferenceMatches(pack, path, trimmed)) return { path, loadedBy: "compactionEntryId" };
		}
		return { loadedBy: "missing" };
	}
	return { path: latestContextPackArtifactPath(), loadedBy: "latest" };
}

export function parseContextPackArtifact(path: string): ContextPackArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as ContextPackArtifact;
	} catch {
		return undefined;
	}
}

export function latestOrBuildContextPack(options: { target?: string } = {}): {
	context: ContextPackArtifact;
	path: string;
} {
	const latest = !options.target ? latestContextPackArtifactPath() : undefined;
	if (latest) {
		const context = parseContextPackArtifact(latest);
		if (context) return { context, path: latest };
	}
	const context = buildContextPack({ target: options.target, mode: "pack" });
	const path = writeContextPackArtifact(context);
	return { context, path };
}

export function buildContextDigest(limit = 5000): string {
	const path = latestContextPackArtifactPath();
	if (!path) return "no context pack yet; call re_context pack after reflection/supervisor or before compaction.";
	return truncateMiddle(readText(path), limit);
}

export function latestContextPackArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("context", evidenceContextsDir(), options);
}

export function contextArtifactIndex(options: ArtifactScopeFilterOptions = {}): ContextArtifactIndexEntry[] {
	return scopedContextArtifactIndex(options).entries;
}
