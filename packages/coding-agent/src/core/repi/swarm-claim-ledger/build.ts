/** Swarm claim ledger builder with reverse merge claim gate. */

import { appendSwarmCollisionChallengeEvents } from "./build-challenges.ts";
import { appendSwarmClaimLedgerEvent, runtimeArtifactHashes } from "./pure.ts";
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import { appendSwarmWorkerClaimEvents } from "./worker-claims.ts";

export function buildSwarmRuntimeClaimLedger(swarm: SwarmClaimLedgerInput): SwarmClaimLedgerEventV1[] {
	const events: SwarmClaimLedgerEventV1[] = [];
	const timestamp = swarm.timestamp;
	const planId = swarm.parallelPlan?.planId ?? "missing";
	const scope = swarm.target ?? swarm.missionId ?? swarm.route ?? "re_swarm";
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "artifact_handoff",
			claimId: `${planId}:artifact_handoff`,
			workerId: "re_swarm",
			role: "swarm",
			scope,
			statement: "re_swarm emitted ReconParallelPlanV1-bound worker runtime packets and merge contract.",
			evidenceRefs: [
				swarm.delegationArtifact,
				swarm.subagentRuntimeManifestPath,
				...(swarm.parallelPlan?.merge?.expectedArtifacts ?? []),
				...(swarm.subagentRuntimeManifests ?? []).flatMap((manifest: any) => [
					manifest.runtimeManifestFile,
					manifest.stdoutPath,
					manifest.stderrPath,
				]),
				...swarm.sourceArtifacts,
			].filter((item): item is string => Boolean(item)),
			artifactHashes: runtimeArtifactHashes([
				swarm.delegationArtifact,
				swarm.subagentRuntimeManifestPath,
				...(swarm.subagentRuntimeManifests ?? []).flatMap((manifest: any) => [
					manifest.runtimeManifestFile,
					manifest.stdoutPath,
					manifest.stderrPath,
				]),
				...swarm.sourceArtifacts,
			]),
			metadata: {
				mode: swarm.mode,
				planId,
				workerCount: swarm.workers.length,
				executionCount: swarm.executions.length,
				subagentRuntimeManifestCount: swarm.subagentRuntimeManifestCount,
				subagentRuntimeManifestsCaptured: swarm.subagentRuntimeManifestsCaptured,
				mergeStrategy: swarm.parallelPlan?.merge?.strategy ?? "missing",
			},
		},
		timestamp,
	);
	for (const worker of swarm.workers) {
		appendSwarmWorkerClaimEvents(events, swarm, worker, planId, scope, timestamp);
	}
	appendSwarmCollisionChallengeEvents(events, swarm, planId, scope, timestamp);
	return events;
}
