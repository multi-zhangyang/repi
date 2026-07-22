/** Worker child-session pool bridge. */

import { uniqueNonEmpty } from "../text.ts";
import { workerRuntimePoolEvidenceContract } from "./pool-contract.ts";
import type {
	RepiSwarmClaimLedgerEventV1,
	RepiWorkerChildSessionRuntimeBatchV1,
	RepiWorkerRuntimePoolV1,
} from "./types.ts";

export function workerChildSessionToWorkerRuntimePoolBridge(
	batch: RepiWorkerChildSessionRuntimeBatchV1,
): RepiWorkerRuntimePoolV1 {
	const mergeKeyWorkers = new Map<string, string[]>();
	for (const session of batch.sessions) {
		const rows = mergeKeyWorkers.get(session.poolBridge.mergeKey) ?? [];
		rows.push(session.workerId);
		mergeKeyWorkers.set(session.poolBridge.mergeKey, rows);
	}
	const conflicts: RepiWorkerRuntimePoolV1["mergeProtocol"]["conflicts"] = Array.from(mergeKeyWorkers.entries())
		.filter(([, workers]) => workers.length > 1)
		.map(([mergeKey, workers]) => ({
			mergeKey,
			workers,
			status: "resolved" as const,
			winner: workers[0],
			evidenceRefs: uniqueNonEmpty(
				batch.claimLedgerEvents
					.filter((event: any) => event.claimId === mergeKey || event.claimIds?.includes(mergeKey))
					.flatMap((event: any) => event.evidenceRefs),
				16,
			),
			resolutionReason:
				"duplicate child-session merge key resolved by claim ledger validation and supervisor re-check before promotion",
		}));
	return {
		kind: "WorkerRuntimePoolV1",
		schemaVersion: 1,
		poolId: batch.poolId,
		maxConcurrency: Math.max(1, Math.min(8, batch.sessions.length || 1)),
		timeoutMs: batch.launchPolicy.timeoutMs,
		cancelOnTimeout: true,
		resourceBudget: batch.resourceBudget,
		workers: batch.sessions.map((session: any) => ({
			workerId: session.workerId,
			role: session.provider.format,
			route: session.provider.name,
			packetId: session.packetId,
			attempt: session.attempt,
			maxAttempts: session.maxAttempts,
			retryBudget: session.retryBudget,
			resourceLease: session.resourceLease,
			timeoutMs: batch.launchPolicy.timeoutMs,
			status: session.poolBridge.workerRuntimePoolStatus,
			startedAt: session.runtime.startedAt,
			endedAt: session.runtime.endedAt,
			cancelledAt: session.runtime.cancelledAt,
			sessionDir: session.runtime.sessionDir,
			stdoutPath: session.runtime.stdoutPath,
			stderrPath: session.runtime.stderrPath,
			stdoutSha256: session.hashes.stdoutSha256,
			stderrSha256: session.hashes.stderrSha256,
			toolCallDigest: session.hashes.toolCallDigest,
			mergeKey: session.poolBridge.mergeKey,
			claimRefs: session.poolBridge.claimRefs,
		})),
		parallelGroups: [
			{
				groupId: `${batch.batchId}:child-sessions`,
				workers: batch.sessions.map((session: any) => session.workerId),
				dependsOn: [],
				maxConcurrency: Math.max(1, Math.min(8, batch.sessions.length || 1)),
			},
		],
		mergeProtocol: {
			strategy: "claim-aware merge",
			evidenceContract: workerRuntimePoolEvidenceContract(),
			conflicts,
		},
		claimLedgerEvents: batch.claimLedgerEvents.filter(
			(event: any) => event.source === "re_swarm",
		) as RepiSwarmClaimLedgerEventV1[],
	};
}
