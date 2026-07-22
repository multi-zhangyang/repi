/** Swarm runtime status/model/retry pure helpers. */
import { createHash } from "node:crypto";
import { slug } from "../text.ts";

type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;
type SwarmRuntimeState = any;
type SwarmRuntimeModelSummary = any;
type SwarmRuntimeRetryBudget = any;

export function swarmRuntimeStatus(executions: SwarmWorkerExecution[]): SwarmRuntimeState {
	if (executions.length === 0) return "queued";
	if (executions.some((execution: any) => execution.timedOut)) return "cancelled";
	if (executions.some((execution: any) => execution.status === "blocked")) return "blocked";
	if (executions.some((execution: any) => execution.status === "skipped")) return "cancelled";
	return "done";
}

export function swarmRuntimeTimeWindow(
	executions: SwarmWorkerExecution[],
	fallback = new Date().toISOString(),
): { startedAt: string; endedAt: string; elapsedMs: number } {
	const startedAt =
		executions
			.map((execution: any) => execution.startedAt)
			.filter((item): item is string => Boolean(item))
			.sort()[0] ?? fallback;
	const endedAt =
		executions
			.map((execution: any) => execution.endedAt)
			.filter((item): item is string => Boolean(item))
			.sort()
			.at(-1) ?? startedAt;
	const parsedStarted = Date.parse(startedAt);
	const parsedEnded = Date.parse(endedAt);
	const elapsedMs =
		Number.isFinite(parsedStarted) && Number.isFinite(parsedEnded)
			? Math.max(0, parsedEnded - parsedStarted)
			: executions.reduce((sum: any, execution: any) => sum + Math.max(0, execution.elapsedMs ?? 0), 0);
	return { startedAt, endedAt, elapsedMs };
}

export function swarmRuntimeModel(executions: SwarmWorkerExecution[]): SwarmRuntimeModelSummary {
	return {
		provider: "re_swarm",
		modelId: "command-level-worker",
		modelCalls: 0,
		toolCalls: executions.length,
		toolResults: executions.length,
	};
}

export function swarmRuntimeRetryBudget(worker: SwarmWorkerRuntime, attempt: number): SwarmRuntimeRetryBudget {
	return {
		signature: `re_swarm:${slug(worker.id)}:${createHash("sha256").update(worker.commands.join("\n")).digest("hex").slice(0, 16)}`,
		attempt,
		maxAttempts: 3,
		remaining: Math.max(0, 3 - attempt),
		exhausted: attempt >= 3,
	};
}
