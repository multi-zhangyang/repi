/** Supervisor conflicts/repair/verdict aggregation. */
import type { SupervisorVerdict } from "../runtime-types.ts";

export function aggregateSupervisorReviews(params: {
	delegate: any;
	swarm: any;
	reviews: any[];
	planCoverage: string[];
	claimCheckResult: string[];
	claimCheckBlocks: boolean;
	strictClaimCheck: any;
	commanderMergeQueue: string[];
	mode?: string;
}): {
	conflicts: string[];
	repairQueue: string[];
	priorityQueue: string[];
	supervisorVerdict: SupervisorVerdict;
} {
	const {
		delegate,
		swarm,
		reviews,
		planCoverage,
		claimCheckResult,
		claimCheckBlocks,
		strictClaimCheck,
		commanderMergeQueue,
		mode,
	} = params;
	const conflicts = Array.from(
		new Set(
			[
				...delegate.gaps,
				...(swarm?.blocked.map((item: string) => `swarm blocked: ${item}`) ?? []),
				...(planCoverage.some((row: any) => /worker_binding=fail|parallel_plan=missing|\bmissing=[1-9]/.test(row))
					? planCoverage.map((row: any) => `parallel plan coverage: ${row}`)
					: []),
				...(swarm?.mergeDigest.filter((item: string) => /^collision:/i.test(item)) ?? []),
				...(claimCheckBlocks ? claimCheckResult.map((item: any) => `strict claim check: ${item}`) : []),
				...reviews.flatMap((review: any) => review.conflicts.map((item: string) => `${review.worker}: ${item}`)),
				delegate.packets.length === 0 ? "no worker packets available" : undefined,
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 32);
	const repairQueue = Array.from(
		new Set([
			...reviews
				.filter((review: any) => review.verdict === "blocked" || review.verdict === "repair" || mode === "repair")
				.sort((left: any, right: any) => left.priority - right.priority || left.score - right.score)
				.flatMap((review: any) => review.repairActions.map((action: string) => `${review.worker}: ${action}`)),
			...commanderMergeQueue.map((action: any) => `commander: ${action}`),
			...(claimCheckBlocks
				? [
						strictClaimCheck.status === "missing"
							? "claim_check: run re_complete audit to write strict claim release marker"
							: "claim_check: resolve required platform gaps and rerun re_complete audit",
					]
				: []),
		]),
	).slice(0, 24);
	const priorityQueue = reviews
		.slice()
		.sort((left: any, right: any) => left.priority - right.priority || left.score - right.score)
		.map((review: any) => `${review.worker} ${review.verdict} score=${review.score} packet=${review.packetId}`);
	const hasBlocked = reviews.some((review: any) => review.verdict === "blocked");
	const hasRepair = reviews.some((review: any) => review.verdict === "repair");
	const hasWatch = reviews.some((review: any) => review.verdict === "watch");
	const supervisorVerdict: SupervisorVerdict = hasBlocked
		? "blocked"
		: claimCheckBlocks
			? "blocked"
			: hasRepair
				? "repair"
				: hasWatch
					? "watch"
					: "pass";
	return { conflicts, repairQueue, priorityQueue, supervisorVerdict };
}
