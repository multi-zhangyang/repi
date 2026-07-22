/** Swarm format runtime/claim/subagent/lease/memory sections. */

import { swarmFormatNextCommand } from "./swarm-format-next.ts";
import type { SwarmFormatView } from "./swarm-format-types.ts";

export function formatSwarmRuntimeSections(swarm: SwarmFormatView): Array<string | undefined> {
	return [
		"structured_claim_merge:",
		`- path=${swarm.structuredClaimMergePath ?? "pending"}`,
		`- status=${swarm.structuredClaimMergeStatus ?? "missing"}`,
		`- final_claims=${swarm.structuredClaimMerge?.promotionCheck?.finalClaims?.length ?? 0}`,
		`- blocked_claims=${swarm.structuredClaimMerge?.promotionCheck?.blockedClaims?.length ?? 0}`,
		...(swarm.structuredClaimMergeErrors?.length
			? swarm.structuredClaimMergeErrors.slice(0, 10).map((item: any) => `- error=${item}`)
			: ["- errors=none"]),
		"subagent_runtime_manifests:",
		`- path=${swarm.subagentRuntimeManifestPath ?? "pending"}`,
		`- count=${swarm.subagentRuntimeManifestCount ?? 0}`,
		`- captured=${swarm.subagentRuntimeManifestsCaptured ? "pass" : "fail"}`,
		...((swarm.subagentRuntimeManifests ?? []).length
			? (swarm.subagentRuntimeManifests ?? [])
					.slice(0, 12)
					.map(
						(manifest: any) =>
							`- worker=${manifest.workerId} role=${manifest.roleId} status=${manifest.status} attempt=${manifest.attempt}/${manifest.retryBudget.maxAttempts} retryRemaining=${manifest.retryBudget.remaining} timeoutMs=${manifest.resourceLimits.timeoutMs} pid=${manifest.pid ?? "null"} sessionDir=${manifest.sessionDir} runtimeManifestFile=${manifest.runtimeManifestFile} stdoutSha256=${manifest.stdoutSha256.slice(0, 16)} stderrSha256=${manifest.stderrSha256.slice(0, 16)} toolCallDigest=${manifest.toolCallDigest.slice(0, 16)}`,
					)
			: ["- none"]),
		"worker_child_session_runtime:",
		`- path=${swarm.workerChildSessionRuntimePath ?? "pending"}`,
		`- status=${swarm.workerChildSessionRuntimeStatus ?? "missing"}`,
		`- sessions=${swarm.workerChildSessionRuntime?.sessions.length ?? 0}`,
		`- pool_bridge=${swarm.workerRuntimePoolBridgeStatus ?? "missing"}`,
		`- childSessionRuntimeCaptured=${swarm.workerChildSessionRuntime?.poolBridge.childSessionRuntimeCaptured ?? false}`,
		...(swarm.workerChildSessionRuntimeErrors?.length
			? swarm.workerChildSessionRuntimeErrors.slice(0, 8).map((error: any) => `- child_error=${error}`)
			: ["- child_errors=none"]),
		...(swarm.workerRuntimePoolBridgeErrors?.length
			? swarm.workerRuntimePoolBridgeErrors.slice(0, 8).map((error: any) => `- pool_error=${error}`)
			: ["- pool_errors=none"]),
		"worker_retry_handoff_closure:",
		`- path=${swarm.workerRetryHandoffClosurePath ?? "pending"}`,
		`- status=${swarm.workerRetryHandoffClosureStatus ?? "missing"}`,
		`- workers=${swarm.workerRetryHandoffClosure?.workers.length ?? 0}`,
		`- recovered=${swarm.workerRetryHandoffClosure?.merge.recoveredWorkers.length ?? 0}`,
		`- unresolved=${swarm.workerRetryHandoffClosure?.merge.unresolvedWorkers.length ?? 0}`,
		`- retry_attempts_bounded=${swarm.workerRetryHandoffClosure?.assertions.retryAttemptsBounded ? "pass" : "fail"}`,
		`- failed_workers_closed=${swarm.workerRetryHandoffClosure?.assertions.failedWorkersHaveRetryOrHandoff ? "pass" : "fail"}`,
		`- timeout_cancel_recorded=${swarm.workerRetryHandoffClosure?.assertions.timeoutCancellationRecorded ? "pass" : "fail"}`,
		`- handoff_recovered=${(swarm.workerRetryHandoffClosure?.merge.recoveredWorkers.length ?? 0) > 0 ? "true" : "false"}`,
		...((swarm.workerRetryHandoffClosure?.workers ?? []).length
			? (swarm.workerRetryHandoffClosure?.workers ?? [])
					.slice(0, 12)
					.map(
						(worker: any) =>
							`- worker=${worker.workerId} status=${worker.status} retryState=${worker.retryState} attempt=${worker.attempt}/${worker.maxAttempts} retryRemaining=${worker.retryRemaining} timedOut=${worker.timedOut} handoffRefs=${worker.handoffRefs.length} retryQueueRefs=${worker.retryQueueRefs.length} claimRefs=${worker.claimRefs.length}`,
					)
			: ["- workers=none"]),
		...(swarm.workerRetryHandoffClosureErrors?.length
			? swarm.workerRetryHandoffClosureErrors.slice(0, 8).map((error: any) => `- retry_handoff_error=${error}`)
			: ["- retry_handoff_errors=none"]),
		"worker_retry_handoff_merge_summary:",
		`- path=${swarm.workerRetryHandoffMergeSummaryPath ?? "pending"}`,
		`- status=${swarm.workerRetryHandoffMergeSummaryStatus ?? "missing"}`,
		`- next_actions=${swarm.workerRetryHandoffMergeSummary?.nextActions.length ?? 0}`,
		`- retry_queued=${swarm.workerRetryHandoffMergeSummary?.retryQueuedWorkers.length ?? 0}`,
		`- handoff_recovered=${swarm.workerRetryHandoffMergeSummary?.handoffRecoveredWorkers.length ?? 0}`,
		`- exhausted_escalated=${swarm.workerRetryHandoffMergeSummary?.exhaustedEscalatedWorkers.length ?? 0}`,
		`- unresolved_workers=${swarm.workerRetryHandoffMergeSummary?.unresolvedWorkers.length ?? 0}`,
		`- unresolved_collisions=${swarm.workerRetryHandoffMergeSummary?.unresolvedCollisions.length ?? 0}`,
		`- retry_budget_visible=${swarm.workerRetryHandoffMergeSummary?.assertions.retryBudgetVisible ? "pass" : "fail"}`,
		`- source_artifacts_preserved=${swarm.workerRetryHandoffMergeSummary?.assertions.sourceArtifactsPreserved ? "pass" : "fail"}`,
		`- worker_closures=${swarm.workerRetryHandoffMergeSummary?.workerClosures.length ?? 0}`,
		...((swarm.workerRetryHandoffMergeSummary?.workerClosures ?? []).length
			? (swarm.workerRetryHandoffMergeSummary?.workerClosures ?? [])
					.slice(0, 12)
					.map(
						(worker: any) =>
							`- closure=${worker.summary} handoffRefs=${worker.handoffRefs.length} retryQueueRefs=${worker.retryQueueRefs.length} repairRefs=${worker.repairRefs.length} claimRefs=${worker.claimRefs.length}`,
					)
			: ["- closure=none"]),
		...((swarm.workerRetryHandoffMergeSummary?.nextActions ?? []).length
			? (swarm.workerRetryHandoffMergeSummary?.nextActions ?? [])
					.slice(0, 8)
					.map((action: any) => `- next=${action}`)
			: ["- next=none"]),
		...(swarm.workerRetryHandoffMergeSummaryErrors?.length
			? swarm.workerRetryHandoffMergeSummaryErrors.slice(0, 8).map((error: any) => `- merge_summary_error=${error}`)
			: ["- merge_summary_errors=none"]),
		"worker_lease_scheduler:",
		`- path=${swarm.workerLeaseSchedulerPath ?? "pending"}`,
		`- status=${swarm.workerLeaseSchedulerStatus ?? "missing"}`,
		`- tasks=${swarm.workerLeaseScheduler?.tasks.length ?? 0}`,
		`- events=${swarm.workerLeaseScheduler?.events.length ?? 0}`,
		`- stale_recovery=${swarm.workerLeaseScheduler?.assertions.staleLeaseRecovered ? "pass" : "fail"}`,
		`- work_stealing=${swarm.workerLeaseScheduler?.assertions.workStealingObserved ? "pass" : "fail"}`,
		`- duplicate_completion_rejected=${swarm.workerLeaseScheduler?.assertions.duplicateCompletionRejected ? "pass" : "fail"}`,
		...(swarm.workerLeaseSchedulerErrors?.length
			? swarm.workerLeaseSchedulerErrors.slice(0, 8).map((error: any) => `- scheduler_error=${error}`)
			: ["- scheduler_errors=none"]),
		"memory_swarm_writeback:",
		`- status=${swarm.memoryWritebackStatus ?? "pending"}`,
		`- events=${swarm.memoryWritebackCount ?? 0}`,
		...(swarm.memoryWritebackEvents?.length
			? swarm.memoryWritebackEvents.map((eventId: any) => `- memory_event=${eventId}`)
			: ["- memory_event=none"]),
		...(swarm.memoryWritebackErrors?.length
			? swarm.memoryWritebackErrors.slice(0, 8).map((error: any) => `- error=${error}`)
			: ["- errors=none"]),
		`next_swarm_command: ${swarmFormatNextCommand(swarm)}`,
		"source_artifacts:",
		...(swarm.sourceArtifacts.length ? swarm.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	];
}
