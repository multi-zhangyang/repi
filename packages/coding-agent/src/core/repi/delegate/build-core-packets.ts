/** Build delegate worker packets from operation steps. */

import {
	adaptiveToolsForWorker,
	delegateEvidenceContract,
	delegateObjective,
	delegateTools,
	delegateWorkerForStep,
} from "./pure.ts";
import type { DelegateWorker } from "./types.ts";

export function buildDelegatePackets(params: {
	operation: any;
	target?: string;
	scoreboard: { entries: any[] };
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
}): any[] {
	const { operation, target, scoreboard, adaptiveRoutingHints, workerPromotionQueue } = params;
	const groups = new Map<DelegateWorker, any[]>();
	for (const step of operation.steps) {
		const worker = delegateWorkerForStep(step);
		const list = groups.get(worker) ?? [];
		list.push(step);
		groups.set(worker, list);
	}
	return [...groups.entries()].map(([worker, steps], index) => {
		const status = steps.every((step: any) => step.status === "done")
			? "done"
			: steps.some((step: any) => step.status === "ready")
				? "ready"
				: "blocked";
		const phases = Array.from(new Set(steps.map((step: any) => step.phase)));
		const sourceArtifacts = Array.from(new Set(steps.flatMap((step: any) => step.sourceArtifacts))).slice(0, 16);
		return {
			id: `worker:${index + 1}:${worker}`,
			worker,
			objective: delegateObjective(worker),
			status,
			phases,
			steps,
			evidenceContract: Array.from(
				new Set([
					...delegateEvidenceContract(worker),
					...(scoreboard.entries.some((entry: any) => entry.worker === worker && entry.score < 80)
						? ["adaptive worker score closure", "negative control or replay artifact"]
						: []),
				]),
			).slice(0, 8),
			recommendedTools: Array.from(
				new Set([...delegateTools(worker), ...adaptiveToolsForWorker(worker, scoreboard.entries)]),
			).slice(0, 12),
			handoffPrompt: [
				`worker=${worker}`,
				`objective=${delegateObjective(worker)}`,
				`target=${target ?? "<target>"}`,
				`evidence_contract=${delegateEvidenceContract(worker).join(" | ")}`,
				`adaptive_score=${scoreboard.entries.find((entry: any) => entry.worker === worker)?.score ?? "none"}`,
				`adaptive_route=${
					adaptiveRoutingHints.find((hint: any) => hint.includes(`:${worker} `) || hint.includes(`:${worker}:`)) ??
					workerPromotionQueue.find((hint: any) => hint.includes(`:${worker} `)) ??
					"none"
				}`,
				`next_steps=${
					steps
						.filter((step: any) => step.status === "ready")
						.map((step: any) => step.command)
						.join(" || ") || "none"
				}`,
			],
			sourceArtifacts,
		};
	});
}
