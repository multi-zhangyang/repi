/** Swarm worker child-session runtime refresh. */

import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import { verifyWorkerRuntimePool } from "../../worker-runtime/pool.ts";
import {
	verifyWorkerChildSessionRuntimeBatch,
	workerChildSessionToWorkerRuntimePoolBridge,
} from "../../worker-runtime.ts";
import { swarmWorkerChildSessionRuntimePath } from "../pure.ts";
import { buildWorkerChildSessionRuntimeBatchFromSwarm } from "./runtime-child-session-build.ts";
import { runWorkerChildProcessProbe } from "./runtime-child-session-probe.ts";

type SwarmArtifact = any;
type WorkerChildSessionRuntimeBatchV1 = any;

export function refreshSwarmWorkerChildSessionRuntime(swarm: SwarmArtifact): SwarmArtifact {
	const path = swarmWorkerChildSessionRuntimePath(swarm);
	if (!(swarm.subagentRuntimeManifests ?? []).length) {
		return {
			...swarm,
			workerChildSessionRuntimePath: path,
			workerChildSessionRuntimeStatus: "missing",
			workerChildSessionRuntimeErrors: ["subagent_runtime_manifests_missing"],
			workerRuntimePoolBridgeStatus: "missing",
			workerRuntimePoolBridgeErrors: ["subagent_runtime_manifests_missing"],
		};
	}
	const initialBatch = buildWorkerChildSessionRuntimeBatchFromSwarm(swarm);
	const childProcessProbe =
		process.env.REPI_SWARM_CHILD_PROCESS_SMOKE === "1" ? runWorkerChildProcessProbe(initialBatch, path) : undefined;
	const batch: WorkerChildSessionRuntimeBatchV1 = childProcessProbe
		? {
				...initialBatch,
				childProcessProbe,
				poolBridge: {
					...initialBatch.poolBridge,
					childProcessRuntimeCaptured: childProcessProbe.status === "pass",
				},
			}
		: initialBatch;
	const batchValidation = verifyWorkerChildSessionRuntimeBatch(batch);
	const pool = workerChildSessionToWorkerRuntimePoolBridge(batch);
	const poolValidation = verifyWorkerRuntimePool(pool);
	// opt #162: atomic temp+rename — torn write no longer truncates the worker
	// runtime pool bridge manifest.
	atomicWriteFileSync(
		path,
		`${JSON.stringify({ batch, batchValidation, workerRuntimePoolBridge: pool, poolValidation }, null, 2)}\n`,
		0o644,
	);
	return {
		...swarm,
		workerChildSessionRuntimePath: path,
		workerChildSessionRuntime: batch,
		workerChildSessionRuntimeStatus: batchValidation.ok ? "pass" : "blocked",
		workerChildSessionRuntimeErrors: batchValidation.errors,
		workerRuntimePoolBridge: pool,
		workerRuntimePoolBridgeStatus: poolValidation.ok ? "pass" : "blocked",
		workerRuntimePoolBridgeErrors: poolValidation.errors,
		sourceArtifacts: Array.from(
			new Set(
				[
					...swarm.sourceArtifacts,
					path,
					batch.childProcessProbe?.stdoutPath,
					batch.childProcessProbe?.stderrPath,
					...batch.sessions.flatMap((session: any) => [
						session.runtime.transcriptPath,
						session.runtime.stdoutPath,
						session.runtime.stderrPath,
					]),
				].filter((item): item is string => Boolean(item)),
			),
		).slice(0, 80),
	};
}
