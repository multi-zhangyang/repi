/** Knowledge-scope isolation for graph reuse filtering. */

import {
	artifactScopeMatchForSource,
	artifactScopeVerdictPriority,
	knowledgeScopePathKey,
} from "./artifact-scope-pure.ts";
import type {
	KnowledgeScopeIsolationBuildOptions,
	KnowledgeScopeIsolationSourceV1,
	KnowledgeScopeIsolationV1,
	KnowledgeScopeSource,
} from "./knowledge-scope-types.ts";
import type { MemoryScopeIsolationRowV1 } from "./memory-stubs.ts";

export {
	buildCurrentMemoryScope,
	buildMemoryScopeIsolationReport,
	currentMemoryScope,
	formatMemoryScopeIsolation,
	type MemoryScopeV1,
	memoryRouteMatches,
	memoryScopeIsolationRow,
	memoryTargetScope,
} from "./knowledge-scope-memory-stubs.ts";
export type {
	KnowledgeScopeIsolationBuildOptions,
	KnowledgeScopeIsolationSourceV1,
	KnowledgeScopeIsolationV1,
	KnowledgeScopeSource,
} from "./knowledge-scope-types.ts";

export function knowledgeScopeRowForSource(
	source: KnowledgeScopeSource,
	rows: MemoryScopeIsolationRowV1[],
	byArtifactPath: Map<string, MemoryScopeIsolationRowV1>,
): MemoryScopeIsolationRowV1 | undefined {
	return artifactScopeMatchForSource(source, rows, byArtifactPath).row;
}
export function buildKnowledgeScopeIsolation(options: KnowledgeScopeIsolationBuildOptions): KnowledgeScopeIsolationV1 {
	const rowsByEvent = new Map(options.memoryScopeReport.rows.map((row: any) => [row.eventId, row]));
	const byArtifactPath = new Map<string, MemoryScopeIsolationRowV1>();
	for (const event of options.events) {
		const row = rowsByEvent.get(event.id);
		if (!row) continue;
		for (const artifact of event.artifactHashes) {
			const key = knowledgeScopePathKey(artifact.path);
			const existing = byArtifactPath.get(key);
			if (
				!existing ||
				artifactScopeVerdictPriority((row as any).verdict) > artifactScopeVerdictPriority((existing as any).verdict)
			) {
				byArtifactPath.set(key, row);
			}
		}
	}
	const sourceRows = options.sources.map((source): KnowledgeScopeIsolationSourceV1 => {
		const row = knowledgeScopeRowForSource(source, options.memoryScopeReport.rows, byArtifactPath);
		const verdict = row?.verdict ?? "allow";
		const reasons = row?.reasons ?? [];
		return {
			path: source.path,
			kind: source.kind,
			eventId: row?.eventId,
			caseSignature: row?.caseSignature,
			verdict,
			reasons,
			blocksKnowledgeReuse: verdict === "block",
		};
	});
	return {
		kind: "repi-knowledge-scope-isolation",
		schemaVersion: 1,
		MemoryScopeIsolationV1: true,
		scope_filter_by_mission_session_workspace_target: true,
		reportPath: options.memoryScopeReport.scopeIsolationReportPath,
		currentScope: options.memoryScopeReport.currentScope,
		checkedSourceCount: sourceRows.length,
		blockedSourceCount: sourceRows.filter((row: any) => (row as any).verdict === "block").length,
		warnSourceCount: sourceRows.filter((row: any) => (row as any).verdict === "warn").length,
		allowedSourceCount: sourceRows.filter((row: any) => (row as any).verdict === "allow").length,
		blockedEventIds: options.memoryScopeReport.blockedEventIds,
		warnEventIds: options.memoryScopeReport.warnEventIds,
		allowedEventIds: options.memoryScopeReport.allowedEventIds,
		quarantinedSourceArtifacts: sourceRows
			.filter((row: any) => (row as any).verdict === "block")
			.map((row: any) => row.path),
		warnSourceArtifacts: sourceRows.filter((row: any) => (row as any).verdict === "warn").map((row: any) => row.path),
		allowedSourceArtifacts: sourceRows
			.filter((row: any) => (row as any).verdict === "allow")
			.map((row: any) => row.path),
		sourceRows,
		requiredChecks: [
			"KnowledgeScopeIsolationV1",
			"MemoryScopeIsolationV1",
			"scope_filter_by_mission_session_workspace_target",
			"knowledge_graph_scope_filter_blocks_quarantined_artifacts",
			"knowledge_graph_command_hints_exclude_scope_blocked_sources",
			"knowledge_scope_isolation_report_in_artifact",
		],
	};
}
