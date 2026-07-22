import { slug, uniqueNonEmpty } from "../../text.ts";

type SwarmArtifact = any;

import type { WorkerChildSessionRuntimeV1 } from "../../runtime-types/swarm-worker-child-policy.ts";
import type { WorkerChildSessionRuntimeStatus } from "../../runtime-types/swarm-worker-child-status.ts";
import type { SwarmSubagentRuntimeManifestRow } from "../../runtime-types/swarm-worker-manifest.ts";
import type { WorkerRuntimePoolWorkerV1 } from "../../runtime-types/swarm-worker-pool.ts";

export function swarmChildSessionStatusFromManifest(
	manifest: SwarmSubagentRuntimeManifestRow,
): WorkerChildSessionRuntimeStatus {
	if (manifest.status === "done") return "passed";
	if (manifest.status === "blocked") return "failed";
	if (manifest.status === "cancelled")
		return manifest.elapsedMs > manifest.resourceLimits.timeoutMs ? "timeout" : "cancelled";
	return "queued";
}

export function swarmChildSessionWorkerStatusFromManifest(
	manifest: SwarmSubagentRuntimeManifestRow,
): WorkerRuntimePoolWorkerV1["status"] {
	if (manifest.status === "done") return "passed";
	if (manifest.status === "blocked") return "failed";
	if (manifest.status === "cancelled")
		return manifest.elapsedMs > manifest.resourceLimits.timeoutMs ? "timeout" : "cancelled";
	return "queued";
}

export function swarmChildSessionProviderFromManifest(
	manifest: SwarmSubagentRuntimeManifestRow,
): WorkerChildSessionRuntimeV1["provider"] {
	return {
		format: "local-openai",
		name: "re_swarm-command-session",
		modelId: manifest.model?.modelId || "command-level-worker",
		baseUrlRef: "$LOCAL_OPENAI_BASE_URL",
		apiKeyRef: "$LOCAL_OPENAI_API_KEY",
		contextWindow: 128000,
		maxTokens: 8192,
	};
}

export function swarmChildSessionClaimRefs(swarm: SwarmArtifact, workerId: string): string[] {
	return uniqueNonEmpty(
		(swarm.claimLedger ?? [])
			.filter(
				(event: any) =>
					event.workerId === workerId &&
					event.claimId &&
					["claim", "validation", "challenge", "resolution", "artifact_handoff"].includes(event.type),
			)
			.map((event: any) => event.claimId),
		8,
	);
}

export function swarmChildSessionTranscript(manifest: SwarmSubagentRuntimeManifestRow, claimRefs: string[]): string {
	return `${[
		JSON.stringify({
			kind: "WorkerChildSessionTranscriptV1",
			sessionId: `child-${slug(manifest.workerId)}-${manifest.attempt}`,
			workerId: manifest.workerId,
			roleId: manifest.roleId,
			status: manifest.status,
			provider: swarmChildSessionProviderFromManifest(manifest),
			claimRefs,
			runtimeManifestFile: manifest.runtimeManifestFile,
			stdoutPath: manifest.stdoutPath,
			stderrPath: manifest.stderrPath,
			stdoutSha256: manifest.stdoutSha256,
			stderrSha256: manifest.stderrSha256,
			toolCallDigest: manifest.toolCallDigest,
		}),
		JSON.stringify({
			event: "pool_bridge",
			poolId: manifest.runId,
			mergeKeys: manifest.mergeKeys,
			retryBudget: manifest.retryBudget,
			resourceLimits: manifest.resourceLimits,
			evidenceRefs: manifest.evidenceRefs,
		}),
	].join("\n")}\n`;
}
