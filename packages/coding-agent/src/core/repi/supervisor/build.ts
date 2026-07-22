/** Supervisor build with reverse domain next. */

import { ensureReconStorage } from "../resources.ts";
import { evidenceLedgerPath, readTextFile as readText } from "../storage.ts";
import { aggregateSupervisorReviews } from "./build-aggregate.ts";
import { assembleSupervisorArtifact, buildSupervisorNextActions } from "./build-assemble.ts";
import { supervisorReverseNextActions } from "./build-reverse.ts";
import {
	commanderWorkerScoreboard,
	latestSwarmForSupervisor,
	supervisorClaimCheckPolicy,
	supervisorPlanCoverage,
	swarmCommanderMergeQueue,
} from "./claim-policy.ts";
import {
	buildClaimCheckResult,
	latestOrBuildDelegate,
	readCurrentMission,
	reviewSwarmWorkerRuntime,
	strictClaimCheckSnapshot,
} from "./deps.ts";
import { buildCommanderMergeBudget, reviewDelegatePacket } from "./review.ts";
import type { SupervisorArtifact } from "./types.ts";
export function buildSupervisor(
	options: { target?: string; task?: string; mode?: "review" | "repair" } = {},
): SupervisorArtifact {
	ensureReconStorage();
	const { delegate, path: delegationArtifact } = latestOrBuildDelegate(options);
	const ledger = readText(evidenceLedgerPath());
	const latestSwarm = latestSwarmForSupervisor({ target: options.target ?? delegate.target });
	const swarm = latestSwarm?.swarm;
	const parallelPlan = swarm?.parallelPlan;
	const planCoverage = supervisorPlanCoverage(swarm);
	const releaseCheckMetadata = swarm?.releaseCheckMetadata ?? [];
	const claimCheckPolicy = supervisorClaimCheckPolicy(parallelPlan, planCoverage);
	const strictClaimCheck = strictClaimCheckSnapshot();
	const claimCheckResult = buildClaimCheckResult(releaseCheckMetadata, claimCheckPolicy, strictClaimCheck);
	const claimCheckBlocks =
		strictClaimCheck.status !== "pass" && (releaseCheckMetadata.length > 0 || claimCheckPolicy.length > 0);
	const swarmReviews = swarm?.workers.map((worker: any) => reviewSwarmWorkerRuntime(worker, swarm, ledger)) ?? [];
	const reviews = [...delegate.packets.map((packet: any) => reviewDelegatePacket(packet, ledger)), ...swarmReviews];
	const commanderMergeQueue = swarmCommanderMergeQueue(swarm);
	const workerScoreboard = commanderWorkerScoreboard(reviews);
	const commanderMergeBudget = buildCommanderMergeBudget(reviews, commanderMergeQueue, swarm);
	const { conflicts, repairQueue, priorityQueue, supervisorVerdict } = aggregateSupervisorReviews({
		delegate,
		swarm,
		reviews,
		planCoverage,
		claimCheckResult,
		claimCheckBlocks,
		strictClaimCheck,
		commanderMergeQueue,
		mode: options.mode,
	});
	const mission = readCurrentMission();
	const checkpoints = mission
		? mission.checkpoints.map(
				(checkpoint: any) =>
					`${checkpoint.name}:${checkpoint.status}${checkpoint.note ? `:${checkpoint.note}` : ""}`,
			)
		: ["mission:none"];
	const reverseNext = supervisorReverseNextActions({
		target: options.target,
		delegateTarget: delegate.target,
		blob: JSON.stringify({
			delegate,
			swarm,
			reviews,
			repairQueue,
			claimCheckPolicy,
			claimCheckResult,
			releaseCheckMetadata,
		}),
	});
	const nextActions = buildSupervisorNextActions({
		repairQueue,
		commanderMergeQueue,
		reverseNext,
		parallelPlan,
	});
	return assembleSupervisorArtifact({
		delegate,
		options,
		delegationArtifact,
		latestSwarm,
		supervisorVerdict,
		reviews,
		conflicts,
		repairQueue,
		commanderMergeQueue,
		commanderMergeBudget,
		workerScoreboard,
		priorityQueue,
		checkpoints,
		nextActions,
		parallelPlan,
		planCoverage,
		releaseCheckMetadata,
		claimCheckPolicy,
		strictClaimCheck,
		claimCheckResult,
		swarm,
	});
}
