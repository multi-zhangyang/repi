/** Refresh swarm worker retry handoff closure. */

/** Swarm worker retry handoff closure builders. */
import { uniqueNonEmpty } from "../text.ts";
import { buildSwarmWorkerRetryHandoffClosure } from "./handoff-build.ts";

type SwarmArtifact = any;

import { atomicWriteFileSync } from "../runtime-adapter-exec-deps.ts";
import { swarmWorkerRetryHandoffClosurePath, swarmWorkerRetryHandoffMergeSummaryPath } from "../swarm-runtime/paths.ts";
import {
	buildWorkerRetryHandoffMergeSummaryV1,
	verifyWorkerRetryHandoffClosureV1,
	verifyWorkerRetryHandoffMergeSummaryV1,
} from "../worker-runtime.ts";

export function refreshSwarmWorkerRetryHandoffClosure(swarm: SwarmArtifact): SwarmArtifact {
	const path = swarmWorkerRetryHandoffClosurePath(swarm);
	const summaryPath = swarmWorkerRetryHandoffMergeSummaryPath(swarm);
	const pool = swarm.workerRuntimePoolBridge;
	if (!pool) {
		return {
			...swarm,
			workerRetryHandoffClosurePath: path,
			workerRetryHandoffClosureStatus: "missing",
			workerRetryHandoffClosureErrors: ["worker_runtime_pool_bridge_missing"],
			workerRetryHandoffMergeSummaryPath: summaryPath,
			workerRetryHandoffMergeSummaryStatus: "missing",
			workerRetryHandoffMergeSummaryErrors: ["worker_runtime_pool_bridge_missing"],
		};
	}
	const report = buildSwarmWorkerRetryHandoffClosure(swarm, pool);
	const validation = verifyWorkerRetryHandoffClosureV1(report);
	const mergeSummary = buildWorkerRetryHandoffMergeSummaryV1(report);
	const mergeSummaryValidation = verifyWorkerRetryHandoffMergeSummaryV1(mergeSummary);
	const artifact = { closure: report, validation };
	atomicWriteFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, 0o644);
	atomicWriteFileSync(
		summaryPath,
		`${JSON.stringify({ summary: mergeSummary, validation: mergeSummaryValidation }, null, 2)}\n`,
		0o644,
	);
	return {
		...swarm,
		workerRetryHandoffClosurePath: path,
		workerRetryHandoffClosure: report,
		workerRetryHandoffClosureStatus: validation.ok ? "pass" : "blocked",
		workerRetryHandoffClosureErrors: validation.errors,
		workerRetryHandoffMergeSummaryPath: summaryPath,
		workerRetryHandoffMergeSummary: mergeSummary,
		workerRetryHandoffMergeSummaryStatus: mergeSummaryValidation.ok ? "pass" : "blocked",
		workerRetryHandoffMergeSummaryErrors: mergeSummaryValidation.errors,
		sourceArtifacts: uniqueNonEmpty(
			[
				...swarm.sourceArtifacts,
				path,
				summaryPath,
				...report.workers.flatMap((worker: any) => [
					...worker.handoffRefs,
					...worker.retryQueueRefs,
					...worker.repairRefs,
				]),
			],
			120,
		),
	};
}
