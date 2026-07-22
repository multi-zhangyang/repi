/** Attack-graph build section: swarm artifacts. */

/** Attack-graph builder. */
import { existsSync } from "node:fs";
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendAttackGraphSwarmReverseGaps } from "./swarm-reverse.ts";
import { appendAttackGraphSwarmWorkerClosures } from "./swarm-workers.ts";

export function appendAttackGraphSwarm(ctx: AttackGraphBuildCtx): void {
	for (const { path, swarm } of ctx.swarmArtifacts) {
		ctx.sourceArtifacts.push(
			path,
			...swarm.sourceArtifacts.filter((artifactPath: any) => existsSync(artifactPath)).slice(0, 8),
			...[swarm.workerRetryHandoffClosurePath, swarm.workerRetryHandoffMergeSummaryPath]
				.filter((artifactPath): artifactPath is string => Boolean(artifactPath && existsSync(artifactPath)))
				.slice(0, 2),
		);
		const swarmBase = ctx.artifactBasename(path);
		const swarmId = `swarm:${ctx.slug(swarmBase)}`;
		const workerClosures = swarm.workerRetryHandoffMergeSummary?.workerClosures ?? [];
		ctx.addNode({
			id: swarmId,
			kind: "verification",
			label: `re_swarm ${swarm.mode}`,
			status: `workers=${swarm.workers.length} closures=${workerClosures.length} retry=${swarm.workerRetryHandoffMergeSummaryStatus ?? "missing"}`,
			path,
			note: `target=${swarm.target ?? "<none>"} retry_queue=${swarm.retryQueue.length} blocked=${swarm.blocked.length}`,
		});
		ctx.addTask({
			id: swarmId,
			parentId: swarm.missionId
				? `mission:${swarm.missionId}`
				: ctx.mission
					? `mission:${ctx.mission.id}`
					: undefined,
			kind: "verification",
			label: `re_swarm ${swarm.mode}`,
			status: `workers=${swarm.workers.length} closures=${workerClosures.length}`,
			path,
			evidence: [
				`retry_handoff_closure=${swarm.workerRetryHandoffClosureStatus ?? "missing"}`,
				`retry_handoff_merge_summary=${swarm.workerRetryHandoffMergeSummaryStatus ?? "missing"}`,
				`retry_budget_visible=${swarm.workerRetryHandoffMergeSummary?.assertions.retryBudgetVisible ? "pass" : "fail"}`,
				`source_artifacts_preserved=${swarm.workerRetryHandoffMergeSummary?.assertions.sourceArtifactsPreserved ? "pass" : "fail"}`,
				`next_actions=${swarm.workerRetryHandoffMergeSummary?.nextActions.length ?? 0}`,
			],
		});
		if (ctx.mission)
			ctx.addEdge({
				from: `mission:${ctx.mission.id}`,
				to: swarmId,
				kind: "verifies",
				label: "swarm-worker-closure",
			});
		appendAttackGraphSwarmWorkerClosures(ctx, { path, swarm, swarmBase, workerClosures });
		for (const error of [
			...(swarm.workerRetryHandoffClosureErrors ?? []),
			...(swarm.workerRetryHandoffMergeSummaryErrors ?? []),
		].slice(0, 10)) {
			ctx.gaps.push(`swarm retry handoff error: ${error}`);
		}
		appendAttackGraphSwarmReverseGaps(ctx, swarm);
	}
}
