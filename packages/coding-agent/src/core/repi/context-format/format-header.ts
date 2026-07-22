/** Context-pack format header/closure/resume sections. */
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPackHeaderSections(pack: ContextPackFormatView, path?: string): Array<string | undefined> {
	return [
		"context_pack:",
		path ? `context_artifact: ${path}` : undefined,
		`timestamp: ${pack.timestamp}`,
		`mode: ${pack.mode}`,
		`mission_id: ${pack.missionId ?? "none"}`,
		`route: ${pack.route ?? "none"}`,
		`target: ${pack.target ?? "<none>"}`,
		`contract_id: ${pack.contractId ?? "none"}`,
		`schema_version: ${pack.schemaVersion ?? "legacy"}`,
		`contextpath: ${pack.contextPath ?? "none"}`,
		`context_sha256: ${pack.contextSha256 ?? "none"}`,
		`resumed_from_contextpath: ${pack.resumedFromContextPath ?? "none"}`,
		`resume_queue_status: ${pack.resumeQueueStatus ?? "unknown"}`,
		`idempotency_key: ${pack.idempotencyKey ?? "none"}`,
		`active_lane: ${pack.activeLane ?? "none"}`,
		"closure:",
		`- status=${pack.closure?.status ?? "missing"}`,
		`- closed_at=${pack.closure?.closedAt ?? "none"}`,
		`- reason=${pack.closure?.reason ?? "missing"}`,
		`- verified_by=${pack.closure?.verifiedBy ?? "missing"}`,
		"exact_resume_verification:",
		...(pack.exactResumeVerification
			? [
					`- loaded_by=${pack.exactResumeVerification.loadedBy}`,
					`- source_path=${pack.exactResumeVerification.sourcePath ?? "none"}`,
					`- context_sha256=${pack.exactResumeVerification.contextSha256}`,
					`- artifact_hashes=${pack.exactResumeVerification.artifactHashes}`,
					`- scope=${pack.exactResumeVerification.scope}`,
					`- blocked=${pack.exactResumeVerification.blocked.join(" | ") || "none"}`,
					`- warnings=${pack.exactResumeVerification.warnings.join(" | ") || "none"}`,
				]
			: ["- none"]),
		"resume_brief:",
		...pack.resumeBrief.map((item: any) => `- ${item}`),
		"check_summary:",
		...(pack.checkSummary.length ? pack.checkSummary.map((item: any) => `- ${item}`) : ["- none"]),
		"artifact_index:",
		...(pack.artifactIndex.length
			? pack.artifactIndex.map(
					(item: any) =>
						`- ${item.kind}: ${item.path} exists=${item.exists ?? "unknown"} sha256=${item.sha256 ?? "none"} scope=${item.scopeVerdict ?? "untracked"}`,
				)
			: ["- none"]),
		"artifact_scope_filter:",
		`- ArtifactScopeFilterV1=${pack.artifactScopeFilter?.ArtifactScopeFilterV1 ?? false}`,
		`- latest_artifact_side_channel_scope_filter=${pack.artifactScopeFilter?.latest_artifact_side_channel_scope_filter ?? false}`,
		`- checked=${pack.artifactScopeFilter?.checkedArtifactCount ?? 0}`,
		`- blocked=${pack.artifactScopeFilter?.blockedArtifactCount ?? 0}`,
		`- warn=${pack.artifactScopeFilter?.warnArtifactCount ?? 0}`,
		`- report=${pack.artifactScopeFilter?.reportPath ?? "none"}`,
		"artifact_scope_quarantine:",
		...(pack.artifactScopeFilter?.quarantinedArtifacts.length
			? pack.artifactScopeFilter.quarantinedArtifacts.map((item: any) => `- ${item}`)
			: ["- none"]),
	];
}
