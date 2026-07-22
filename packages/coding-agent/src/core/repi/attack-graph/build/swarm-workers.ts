/** Attack-graph swarm worker closure nodes/tasks/gaps. */
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphSwarmWorkerClosures(
	ctx: AttackGraphBuildCtx,
	args: { path: string; swarm: any; swarmBase: string; workerClosures: any[] },
): void {
	const { path, swarm: _swarm, swarmBase, workerClosures } = args;
	const swarmId = `swarm:${ctx.slug(swarmBase)}`;
	for (const [index, closure] of workerClosures.slice(0, 18).entries()) {
		const closureId = `verify:swarm-worker-closure:${ctx.slug(swarmBase)}:${ctx.slug(closure.workerId)}:${index + 1}`;
		const nextId = `command:swarm-worker-closure:${ctx.slug(swarmBase)}:${ctx.slug(closure.workerId)}:${index + 1}`;
		const closing =
			closure.closure === "passed" ||
			closure.closure === "handoff_recovered" ||
			closure.closure === "exhausted_escalated";
		ctx.addNode({
			id: closureId,
			kind: "verification",
			label: `worker_retry_handoff_closure ${closure.workerId}`,
			status: closure.closure,
			path,
			note: closure.summary,
		});
		ctx.addTask({
			id: closureId,
			parentId: swarmId,
			kind: "verification",
			label: `worker_retry_handoff_closure ${closure.workerId}`,
			status: closure.closure,
			command: closure.nextAction,
			path,
			evidence: [
				closure.summary,
				`attempt=${closure.attempt}/${closure.maxAttempts}`,
				`retry_remaining=${closure.retryRemaining}`,
				`timed_out=${closure.timedOut}`,
				`next=${closure.nextAction}`,
				...closure.evidenceRefs.slice(0, 5),
			],
		});
		ctx.addNode({
			id: nextId,
			kind: "command",
			label: ctx.truncateMiddle(closure.nextAction, 160),
			status: "worker-closure-next",
			note: `worker=${closure.workerId} closure=${closure.closure}`,
		});
		ctx.addTask({
			id: nextId,
			parentId: closureId,
			kind: "command",
			label: ctx.truncateMiddle(closure.nextAction, 180),
			status: "worker-closure-next",
			command: closure.nextAction,
			evidence: closure.evidenceRefs.slice(0, 4),
		});
		ctx.addEdge({
			from: closureId,
			to: swarmId,
			kind: closing ? "verifies" : "blocks",
			label: "worker-retry-handoff-closure",
		});
		ctx.addEdge({ from: swarmId, to: nextId, kind: "suggests", label: "worker-closure-next" });
		ctx.addEdge({ from: nextId, to: closureId, kind: "supports", label: "closure-action" });
		if (!closing) {
			ctx.gaps.push(
				`swarm worker closure ${closure.closure}: worker=${closure.workerId} retry_state=${closure.retryState} next=${closure.nextAction}`,
			);
		}
	}
}
