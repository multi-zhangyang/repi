/** Assemble context-pack load-state fields after mission/supervisor resolution. */
import { truncateMiddle } from "../text.ts";

export function buildContextPackLoadFields(input: {
	timestamp: string;
	mission: any;
	active: any;
	requestedTarget: any;
	contextLatestScope: any;
	supervisorPath: any;
	reflectionPath: any;
	supervisor: any;
	reflection: any;
	target: any;
	autonomousBudget: any;
	swarmRetry: any;
	options: any;
}): Record<string, any> {
	const { mission, supervisor, reflection, swarmRetry } = input;
	const checkSummary = mission
		? mission.checkpoints.map(
				(checkpoint: any) =>
					`${checkpoint.name}=${checkpoint.status}${checkpoint.note ? `:${truncateMiddle(checkpoint.note, 160)}` : ""}`,
			)
		: ["no active mission"];
	const pendingGates =
		mission?.checkpoints
			.filter((checkpoint: any) => checkpoint.status !== "done")
			.map((checkpoint: any) => checkpoint.name) ?? [];
	const repairQueue = Array.from(
		new Set([
			...swarmRetry.rows,
			...(reflection?.repairPlaybook ?? []),
			...(supervisor?.repairQueue ?? []),
			...(supervisor?.commanderMergeQueue ?? []),
			...(supervisor?.nextActions ?? []),
		]),
	).slice(0, 36);
	return {
		timestamp: input.timestamp,
		mission,
		active: input.active,
		requestedTarget: input.requestedTarget,
		contextLatestScope: input.contextLatestScope,
		supervisorPath: input.supervisorPath,
		reflectionPath: input.reflectionPath,
		supervisor,
		reflection,
		target: input.target,
		autonomousBudget: input.autonomousBudget,
		swarmRetry,
		checkSummary,
		pendingGates,
		repairQueue,
		commanderMergeBudget: Array.from(new Set(supervisor?.commanderMergeBudget ?? [])).slice(0, 16),
		workerScoreboard: Array.from(new Set(supervisor?.workerScoreboard ?? [])).slice(0, 32),
		swarmRetryQueue: swarmRetry.rows,
		options: input.options,
	};
}
