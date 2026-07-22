/** Build ArtifactScopeFilterReportV1 with reverse proof requiredChecks. */

import {
	artifactExplicitTarget,
	artifactScopeMatchForSource,
	artifactScopeVerdictPriority,
	knowledgeScopePathKey,
} from "./artifact-scope-pure.ts";
import type {
	ArtifactScopeFilterDecisionV1,
	ArtifactScopeFilterReportV1,
	ArtifactScopeMemoryRow,
	ArtifactScopeReportBuildOptions,
} from "./artifact-scope-types.ts";

export function buildArtifactScopeFilterReport<T extends ArtifactScopeMemoryRow>(
	options: ArtifactScopeReportBuildOptions<T>,
): ArtifactScopeFilterReportV1 {
	const memoryRows = options.memoryReport?.rows ?? [];
	const rowsByEvent = new Map(memoryRows.map((row: any) => [row.eventId, row]));
	const byArtifactPath = new Map<string, T>();
	for (const event of options.events) {
		const row = rowsByEvent.get(event.id);
		if (!row) continue;
		for (const artifact of event.artifactHashes) {
			const key = knowledgeScopePathKey(artifact.path);
			const existing = byArtifactPath.get(key);
			if (!existing || artifactScopeVerdictPriority(row.verdict) > artifactScopeVerdictPriority(existing.verdict))
				byArtifactPath.set(key, row);
		}
	}
	const decisions = options.artifacts.map((artifact): ArtifactScopeFilterDecisionV1 => {
		const match = artifactScopeMatchForSource(artifact, memoryRows, byArtifactPath);
		const row = match.row;
		const explicitTarget = artifactExplicitTarget(artifact, {
			sanitizeTarget: options.sanitizeTarget,
			readText: options.readText,
		});
		const target = options.target;
		const targetMismatch =
			target !== undefined &&
			explicitTarget !== undefined &&
			options.memoryTargetScope(explicitTarget) !== options.memoryTargetScope(target);
		const untrackedTargetScope = Boolean(target && !row && !explicitTarget);
		const verdict = targetMismatch ? "block" : untrackedTargetScope ? "warn" : (row?.verdict ?? "allow");
		const reasons = targetMismatch
			? [`artifact_target_mismatch:${explicitTarget}!=${target}`]
			: untrackedTargetScope
				? [`untracked_artifact_no_memory_scope_binding_for_target:${target}`]
				: (row?.reasons ?? ["untracked_artifact_no_memory_scope_binding"]);
		return {
			kind: "repi-artifact-scope-filter-decision",
			schemaVersion: 1,
			path: artifact.path,
			artifactKind: artifact.kind,
			requestedBy: options.requestedBy,
			eventId: row?.eventId,
			caseSignature: row?.caseSignature,
			verdict,
			reasons,
			blocksArtifactReuse: verdict === "block",
			recommendedAction: verdict === "block" ? "quarantine" : verdict === "warn" ? "manual-review" : "allow",
			matchedBy: match.matchedBy,
		};
	});
	return {
		kind: "repi-artifact-scope-filter-report",
		schemaVersion: 1,
		generatedAt: options.generatedAt ?? new Date().toISOString(),
		ArtifactScopeFilterV1: true,
		MemoryScopeIsolationV1: true,
		latest_artifact_side_channel_scope_filter: true,
		reportPath: options.reportPath,
		requestedBy: options.requestedBy,
		currentScope: options.memoryReport?.currentScope ?? {},
		checkedArtifactCount: decisions.length,
		blockedArtifactCount: decisions.filter((row: any) => row.verdict === "block").length,
		warnArtifactCount: decisions.filter((row: any) => row.verdict === "warn").length,
		allowedArtifactCount: decisions.filter((row: any) => row.verdict === "allow").length,
		quarantinedArtifacts: decisions.filter((row: any) => row.verdict === "block").map((row: any) => row.path),
		warnArtifacts: decisions.filter((row: any) => row.verdict === "warn").map((row: any) => row.path),
		allowedArtifacts: decisions.filter((row: any) => row.verdict === "allow").map((row: any) => row.path),
		decisions,
		requiredChecks: [
			"ArtifactScopeFilterV1",
			"MemoryScopeIsolationV1",
			"latest_artifact_side_channel_scope_filter",
			"artifact_hash_path_matches_memory_scope",
			"blocked_latest_artifact_quarantined",
			"context_artifact_index_excludes_scope_blocked_artifacts",
			"artifact_scope_filter_report_in_context_pack",
			...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof/i.test(
				`${options.requestedBy} ${options.target ?? ""} ${options.artifacts.map((a: any) => a.kind).join(" ")}`,
			)
				? ["reverse_proof_exit_ready", "proof_loop_ready"]
				: []),
		],
	};
}
