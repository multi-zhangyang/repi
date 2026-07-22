/** Swarm compose/build with reverse gates. */

import { deriveSwarmAuditFields, refreshSwarmRuntimeClaimLedger } from "../deps.ts";
import { swarmReleaseCheckMetadata } from "../release.ts";
import type { SwarmArtifact } from "../types.ts";
import { finalizeSwarmReverseGates } from "./compose-reverse.ts";
import { composeSwarmWorkersAndPlan } from "./compose-workers.ts";
import { swarmPlanCoverage } from "./plan.ts";

export function buildSwarm(
	options: { target?: string; task?: string; mode?: "plan" | "run" | "merge" } = {},
): SwarmArtifact {
	const bag = composeSwarmWorkersAndPlan(options);
	const {
		delegate,
		delegationArtifact,
		timestamp,
		workers,
		parallelGroups,
		mergeProtocol,
		collisionMatrix,
		evidenceContract,
		commanderNextActions,
		handoffDigest,
		parallelPlan,
		basePlanCoverage,
		releaseCheckMetadata,
		sourceArtifacts,
	} = bag;
	let swarm: SwarmArtifact = {
		timestamp,
		missionId: delegate.missionId,
		route: delegate.route,
		target: delegate.target ?? options.target,
		mode: options.mode ?? "plan",
		delegationArtifact,
		workers,
		executions: [],
		workerResults: [],
		blocked: [],
		mergeDigest: [],
		executionAudit: [],
		coverageMatrix: [],
		retryQueue: [],
		parallelGroups,
		mergeProtocol,
		collisionMatrix,
		evidenceContract,
		commanderNextActions,
		handoffDigest,
		parallelPlan,
		planCoverage: basePlanCoverage,
		releaseCheckMetadata,
		claimLedger: [],
		claimLedgerEventCount: 0,
		runtimeClaimLedgerCaptured: false,
		structuredClaimMergeStatus: "missing",
		structuredClaimMergeErrors: [],
		subagentRuntimeManifests: [],
		subagentRuntimeManifestCount: 0,
		subagentRuntimeManifestsCaptured: false,
		workerChildSessionRuntimeStatus: "missing",
		workerChildSessionRuntimeErrors: [],
		workerLeaseSchedulerStatus: "missing",
		workerLeaseSchedulerErrors: [],
		workerRuntimePoolBridgeStatus: "missing",
		workerRuntimePoolBridgeErrors: [],
		workerRetryHandoffClosureStatus: "missing",
		workerRetryHandoffClosureErrors: [],
		workerRetryHandoffMergeSummaryStatus: "missing",
		workerRetryHandoffMergeSummaryErrors: [],
		memoryWritebackEvents: [],
		memoryWritebackCount: 0,
		memoryWritebackStatus: "pending",
		memoryWritebackErrors: [],
		sourceArtifacts,
	};
	swarm = finalizeSwarmReverseGates(swarm);
	const auditFields = deriveSwarmAuditFields(swarm);
	const swarmWithAudit = { ...swarm, ...auditFields };
	return refreshSwarmRuntimeClaimLedger({
		...swarmWithAudit,
		planCoverage: swarmPlanCoverage(swarmWithAudit),
		releaseCheckMetadata: swarmReleaseCheckMetadata(swarmWithAudit.parallelPlan),
	});
}
