/** Swarm artifact evidence + checkpoint writes. */

import { appendEvidence } from "../deps.ts";
import type { SwarmArtifact } from "../types.ts";

export function appendSwarmArtifactEvidence(swarm: SwarmArtifact, path: string): void {
	appendEvidence({
		kind: swarm.mode === "run" ? "runtime" : "artifact",
		title: `swarm-${swarm.mode} ${swarm.missionId ?? "no-mission"}`,
		fact: `Built swarm ${swarm.mode} with ${swarm.workers.length} worker runtime packet(s), ${swarm.executions.length} execution(s), ${swarm.parallelGroups.length} parallel group(s), ${swarm.collisionMatrix.length} collision(s), ${swarm.blocked.length} blocked, audit=${swarm.executionAudit.length}, retries=${swarm.retryQueue.length}, parallel_plan=${swarm.parallelPlan?.planId ?? "missing"}, plan_coverage=${swarm.planCoverage.length}, release_check_metadata=${swarm.releaseCheckMetadata.length}, subagent_runtime_manifests=${swarm.subagentRuntimeManifestCount} captured=${swarm.subagentRuntimeManifestsCaptured ? "pass" : "fail"}, runtime_claim_ledger=${swarm.claimLedgerEventCount} hash_chain=${swarm.runtimeClaimLedgerCaptured ? "pass" : "fail"}, structured_claim_merge=${swarm.structuredClaimMergeStatus ?? "missing"}, retry_handoff_closure=${swarm.workerRetryHandoffClosureStatus ?? "missing"}, retry_handoff_merge_summary=${swarm.workerRetryHandoffMergeSummaryStatus ?? "missing"}`,
		command: `re_swarm ${swarm.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "multi-specialist swarm orchestration",
	});
}
