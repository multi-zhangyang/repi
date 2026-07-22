/** Swarm worker/plan construction for compose. */

import { ensureReconStorage } from "../../resources.ts";
import { latestOrBuildDelegate } from "../deps.ts";
import { swarmReleaseCheckMetadata } from "../release.ts";
import type { SwarmWorkerRuntime } from "../types.ts";
import { mapDelegatePacketsToSwarmWorkers, swarmCollisionMatrix, swarmParallelGroups } from "./compose-workers-map.ts";
import { composeSwarmReverseCommanderNext } from "./compose-workers-reverse.ts";
import { buildSwarmParallelPlan, swarmPlanCoverage } from "./plan.ts";

export function composeSwarmWorkersAndPlan(options: {
	target?: string;
	task?: string;
	mode?: "plan" | "run" | "merge";
}): {
	delegate: any;
	delegationArtifact: string;
	timestamp: string;
	workers: SwarmWorkerRuntime[];
	parallelGroups: string[];
	mergeProtocol: string[];
	collisionMatrix: string[];
	evidenceContract: string[];
	commanderNextActions: string[];
	handoffDigest: string[];
	parallelPlan: any;
	basePlanCoverage: any;
	releaseCheckMetadata: any;
	sourceArtifacts: string[];
} {
	ensureReconStorage();
	const { delegate, path: delegationArtifact } = latestOrBuildDelegate(options);
	const timestamp = new Date().toISOString();
	const workers = mapDelegatePacketsToSwarmWorkers({
		delegate,
		target: options.target,
		mode: options.mode,
	});
	const parallelGroups = swarmParallelGroups(workers);
	const mergeProtocol = [
		"1. collect each worker's Outcome/Key Evidence/Verification/Next Step packet",
		"2. reject claims without command/path/hash/request/offset/state-transition evidence",
		"3. resolve conflicts by runtime/replay/verifier evidence order",
		"4. write merged evidence to ledger, then re_supervisor review and re_verifier matrix",
		"5. preserve unresolved gaps as re_operator escalation_queue or re_autofix evidence_recapture_queue",
	];
	const collisionMatrix = swarmCollisionMatrix(workers, delegate.target ?? options.target);
	const evidenceContract = Array.from(new Set(workers.flatMap((worker: any) => worker.evidenceContract))).slice(0, 24);
	const reverseNext = composeSwarmReverseCommanderNext(workers, options.target ?? delegate.target);
	const commanderNextActions = Array.from(
		new Set([
			...reverseNext,
			...workers
				.filter((worker: any) => worker.status === "ready")
				.flatMap((worker: any) => worker.commands.slice(0, 2)),
			"re_swarm merge",
			"re_supervisor review",
			"re_verifier matrix",
			"re_context pack",
		]),
	).slice(0, 18);
	const handoffDigest = workers.map(
		(worker: any) =>
			`${worker.id} status=${worker.status} deps=${worker.dependencies.join(",")} tools=${worker.recommendedTools.slice(0, 5).join(",")}`,
	);
	const parallelPlan = buildSwarmParallelPlan({
		delegate,
		delegationArtifact,
		workers,
		timestamp,
		target: options.target,
		mode: options.mode ?? "plan",
	});
	const basePlanCoverage = swarmPlanCoverage({ workers, parallelPlan, coverageMatrix: [], collisionMatrix });
	const releaseCheckMetadata = swarmReleaseCheckMetadata(parallelPlan);
	const sourceArtifacts = Array.from(
		new Set([
			delegationArtifact,
			...delegate.sourceArtifacts,
			...workers.flatMap((worker: any) => worker.sourceArtifacts),
		]),
	).slice(0, 40);
	return {
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
	};
}
