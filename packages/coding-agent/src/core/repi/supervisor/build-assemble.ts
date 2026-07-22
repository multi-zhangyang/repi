/** Assemble supervisor nextActions + result object. */
import type { SupervisorArtifact } from "./types.ts";

export function buildSupervisorNextActions(input: {
	repairQueue: string[];
	commanderMergeQueue: string[];
	reverseNext: string[];
	parallelPlan: unknown;
}): string[] {
	return Array.from(
		new Set([
			...input.repairQueue.map((item: any) => item.replace(/^.+?:\s*/, "")),
			...input.commanderMergeQueue,
			...input.reverseNext,
			...(input.parallelPlan ? [] : ["re_swarm plan"]),
			"re_delegate merge",
			"re_swarm merge",
			"re_operation next",
			"re_complete audit",
		]),
	).slice(0, 16);
}

export function assembleSupervisorArtifact(input: {
	delegate: any;
	options: { target?: string; task?: string; mode?: "review" | "repair" };
	delegationArtifact: string;
	latestSwarm: any;
	supervisorVerdict: any;
	reviews: any;
	conflicts: any;
	repairQueue: any;
	commanderMergeQueue: any;
	commanderMergeBudget: any;
	workerScoreboard: any;
	priorityQueue: any;
	checkpoints: any;
	nextActions: string[];
	parallelPlan: any;
	planCoverage: any;
	releaseCheckMetadata: any;
	claimCheckPolicy: any;
	strictClaimCheck: any;
	claimCheckResult: any;
	swarm: any;
}): SupervisorArtifact {
	const {
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
	} = input;
	return {
		timestamp: new Date().toISOString(),
		missionId: delegate.missionId,
		route: delegate.route,
		target: options.target ?? delegate.target,
		mode: options.mode ?? "review",
		delegationArtifact,
		swarmArtifact: latestSwarm?.path,
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
		sourceArtifacts: Array.from(
			new Set(
				[
					delegationArtifact,
					latestSwarm?.path,
					...delegate.sourceArtifacts,
					...(swarm?.sourceArtifacts ?? []),
				].filter(Boolean) as string[],
			),
		).slice(0, 36),
	};
}
