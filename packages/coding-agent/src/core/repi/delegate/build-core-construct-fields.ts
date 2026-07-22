/** Delegate artifact field assembly (gaps/queues/nextActions). */
import { operatorCommandConcrete } from "./deps.ts";

export function buildDelegateArtifactFields(params: {
	operation: any;
	target?: string;
	packets: any[];
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	autonomousBudget: any;
}): {
	gaps: string[];
	mergeQueue: string[];
	specialistCoverage: string[];
	nextActions: string[];
} {
	const { operation, target, packets, adaptiveRoutingHints, workerPromotionQueue, autonomousBudget } = params;
	const gaps = Array.from(
		new Set(
			[
				...operation.blocked.map((item: any) => `operation: ${item}`),
				...packets
					.filter((packet: any) => packet.status === "blocked")
					.map((packet: any) => `worker blocked: ${packet.worker}`),
				...adaptiveRoutingHints.map((hint: any) => `adaptive routing: ${hint}`),
				...autonomousBudget.demotionRules.map((item: any) => `budget demotion: ${item}`),
				packets.length === 0 ? "no delegate packets generated" : undefined,
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 24);
	const mergeQueue = [
		...packets.map((packet: any) => `${packet.id} ${packet.worker} status=${packet.status}`),
		...workerPromotionQueue,
		...autonomousBudget.demotionRules,
	].slice(0, 32);
	const specialistCoverage = packets.map(
		(packet: any) => `${packet.worker}: phases=${packet.phases.length} steps=${packet.steps.length}`,
	);
	const nextActions = Array.from(
		new Set([
			...packets
				.filter((packet: any) => packet.status === "ready")
				.flatMap((packet: any) =>
					packet.steps
						.filter((step: any) => step.status === "ready")
						.slice(0, 2)
						.map((step: any) => step.command),
				),
			...adaptiveRoutingHints
				.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? [])
				.map((command: any) => operatorCommandConcrete(command, target).command),
			...workerPromotionQueue
				.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? [])
				.map((command: any) => operatorCommandConcrete(command, target).command),
			...autonomousBudget.nextActions,
			"re_operation run <target> 1",
			"re_delegate merge",
			"re_complete audit",
		]),
	).slice(0, 16);
	return { gaps, mergeQueue, specialistCoverage, nextActions };
}
