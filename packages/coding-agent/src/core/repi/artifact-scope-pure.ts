/** Artifact scope pure helpers and formatters. */
import type {
	ArtifactScopeFilterDecisionV1,
	ArtifactScopeFilterReportV1,
	ArtifactScopeMemoryRow,
	RepiScopeVerdict,
} from "./artifact-scope-types.ts";

export function knowledgeScopePathKey(path: string): string {
	return path.trim().replace(/\\/g, "/").toLowerCase();
}

export function artifactTargetMatches(target: string | undefined, artifactTarget: string | undefined): boolean {
	return !target || !artifactTarget || artifactTarget === target;
}

export function artifactScopeVerdictPriority(verdict: RepiScopeVerdict | undefined): number {
	if (verdict === "block") return 3;
	if (verdict === "warn") return 2;
	if (verdict === "allow") return 1;
	return 0;
}

export function artifactScopeInferTarget(text?: string): string | undefined {
	const value = String(text ?? "");
	const url = value.match(/https?:\/\/[^\s'"`<>)]+/i)?.[0];
	if (url) return url.replace(/[),.;]+$/, "");
	const host = value.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?\b/i)?.[0];
	return host;
}

export function artifactScopeMatchForSource<T extends ArtifactScopeMemoryRow>(
	source: { path: string; text?: string },
	rows: T[],
	byArtifactPath: Map<string, T>,
): { row?: T; matchedBy: ArtifactScopeFilterDecisionV1["matchedBy"] } {
	const direct = byArtifactPath.get(knowledgeScopePathKey(source.path));
	if (direct) return { row: direct, matchedBy: "artifact-hash" };
	const text = `${source.path}\n${source.text ?? ""}`;
	const matches = rows.filter(
		(row: any) =>
			text.includes(row.eventId) ||
			text.includes(row.caseSignature) ||
			(row.eventScope?.target && text.toLowerCase().includes(row.eventScope.target.toLowerCase())),
	);
	if (!matches.length) return { matchedBy: "untracked" };
	return {
		row:
			matches.find((row: any) => row.verdict === "block") ??
			matches.find((row: any) => row.verdict === "warn") ??
			matches[0],
		matchedBy: "text-reference",
	};
}

export function artifactExplicitTarget(
	source: { path: string; text?: string },
	options: { sanitizeTarget?: (target: string) => string | undefined; readText?: (path: string) => string } = {},
): string | undefined {
	const text = source.text ?? options.readText?.(source.path) ?? "";
	const match = /^(?:target|url):\s*(.+)$/im.exec(text)?.[1]?.trim();
	if (!match || /^<.*>$|none|missing$/i.test(match)) return undefined;
	return options.sanitizeTarget?.(match) ?? match;
}

export function artifactScopeDecisionMap(
	report: ArtifactScopeFilterReportV1,
): Map<string, ArtifactScopeFilterDecisionV1> {
	return new Map(report.decisions.map((decision: any) => [knowledgeScopePathKey(decision.path), decision]));
}

export {
	formatArtifactScopeFilter,
	getScopedMarkdownArtifactSelectionCache,
	withScopedMarkdownArtifactSelectionCache,
} from "./artifact-scope-format.ts";
