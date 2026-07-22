/** Swarm worker child-session batch builder. */
import { join } from "node:path";
import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import type {
	WorkerChildSessionClaimLedgerEventV1,
	WorkerChildSessionRuntimeV1,
} from "../../runtime-types/swarm-worker-child-policy.ts";
import type { WorkerChildSessionRuntimeStatus } from "../../runtime-types/swarm-worker-child-status.ts";
import { slug } from "../../text.ts";
import { workerChildSessionLaunchPolicy } from "../../worker-runtime.ts";
import { swarmExecutionDigest, swarmSubagentSessionRoot } from "../pure.ts";
import {
	swarmChildSessionClaimRefs,
	swarmChildSessionProviderFromManifest,
	swarmChildSessionStatusFromManifest,
	swarmChildSessionTranscript,
	swarmChildSessionWorkerStatusFromManifest,
} from "./child-session.ts";

type SwarmArtifact = any;
type WorkerChildSessionRuntimeBatchV1 = any;

export function buildWorkerChildSessionRuntimeBatchFromSwarm(swarm: SwarmArtifact): WorkerChildSessionRuntimeBatchV1 {
	const manifests = swarm.subagentRuntimeManifests ?? [];
	const batchId = `worker-child-session/${slug(swarm.route ?? swarm.target ?? "swarm")}/${swarm.timestamp}`;
	const poolId = swarm.parallelPlan?.planId ?? `re_swarm/${swarm.timestamp}`;
	const launchPolicy = workerChildSessionLaunchPolicy({
		cwd: process.cwd(),
		isolatedHome: join(swarmSubagentSessionRoot(swarm), ".repi", "agent"),
		timeoutMs: Math.max(
			1000,
			Math.min(
				30 * 60 * 1000,
				Math.max(...manifests.map((manifest: any) => manifest.resourceLimits.timeoutMs), 30000),
			),
		),
	});
	const sessions = manifests.map((manifest: any): WorkerChildSessionRuntimeV1 => {
		const claimRefs = swarmChildSessionClaimRefs(swarm, manifest.workerId);
		const sessionId = `child-${slug(manifest.workerId)}-${manifest.attempt}`;
		const transcriptPath = join(manifest.sessionDir, "transcript.jsonl");
		const transcript = swarmChildSessionTranscript(manifest, claimRefs);
		// opt #162: atomic temp+rename — torn write no longer truncates the
		// child-session transcript that the swarm digest/verifier re-reads.
		atomicWriteFileSync(transcriptPath, transcript, 0o644);
		const transcriptSha256 = swarmExecutionDigest(transcript);
		const timedOut = manifest.elapsedMs > manifest.resourceLimits.timeoutMs;
		const status = timedOut
			? ("timeout" as WorkerChildSessionRuntimeStatus)
			: swarmChildSessionStatusFromManifest(manifest);
		const runtime: WorkerChildSessionRuntimeV1["runtime"] = {
			status,
			pid: manifest.pid,
			sessionDir: manifest.sessionDir,
			transcriptPath,
			stdoutPath: manifest.stdoutPath,
			stderrPath: manifest.stderrPath,
			startedAt: manifest.startedAt,
			endedAt: manifest.endedAt,
			exitCode: manifest.exitCode,
			signal: timedOut ? "SIGTERM" : manifest.signal,
			...(status === "timeout" ? { cancelledAt: manifest.endedAt } : {}),
		};
		return {
			sessionId,
			workerId: manifest.workerId,
			packetId: `packet-${slug(manifest.workerId)}`,
			attempt: manifest.attempt,
			maxAttempts: manifest.retryBudget.maxAttempts,
			provider: swarmChildSessionProviderFromManifest(manifest),
			runtime,
			hashes: {
				transcriptSha256,
				stdoutSha256: manifest.stdoutSha256,
				stderrSha256: manifest.stderrSha256,
				toolCallDigest: manifest.toolCallDigest,
			},
			resourceLease: {
				cpuSlots: 1,
				memoryMb: 768,
				maxProcesses: 2,
			},
			retryBudget: manifest.retryBudget,
			poolBridge: {
				poolId,
				mergeKey: claimRefs[0] ?? manifest.mergeKeys[0] ?? manifest.workerId,
				claimRefs,
				workerRuntimePoolStatus: timedOut
					? ("timeout" as WorkerChildSessionRuntimeStatus)
					: swarmChildSessionWorkerStatusFromManifest(manifest),
			},
			failureRepairRefs: [manifest.failureLedgerPath, manifest.repairQueuePath].filter(Boolean),
		};
	});
	return {
		kind: "WorkerChildSessionRuntimeBatchV1",
		schemaVersion: 1,
		batchId,
		poolId,
		resourceBudget: {
			cpuSlots: Math.max(1, Math.min(8, sessions.length || 1)),
			memoryMb: Math.max(1024, sessions.length * 768),
			maxProcesses: Math.max(2, sessions.length * 2),
		},
		launchPolicy,
		sessions,
		claimLedgerEvents: (swarm.claimLedger ?? []) as WorkerChildSessionClaimLedgerEventV1[],
		poolBridge: {
			kind: "WorkerRuntimePoolV1Bridge",
			poolId,
			workerIds: sessions.map((session: any) => session.workerId),
			claimAwareMerge: true,
			childSessionRuntimeCaptured: sessions.length > 0,
		},
	};
}
