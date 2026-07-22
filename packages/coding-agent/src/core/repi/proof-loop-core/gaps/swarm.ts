/** Proof-loop swarm retry bridge helpers. */

import type { DelegateWorker } from "../../operator-format-types.ts";
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { repiProofLoopCommandTarget as proofLoopCommandTarget } from "../../proof-loop.ts";
import { delegateEvidenceContract, latestOperatorFeedback, latestSwarmRetryQueue } from "../deps.ts";
import { proofLoopGapItems } from "./items.ts";

export function proofLoopSwarmRetryQueue(target?: string): string[] {
	const retry = latestSwarmRetryQueue(target);
	return retry.rows
		.map((row: any, index: any) => {
			const commands = /\bnext=(.+)$/i.exec(row)?.[1]?.trim() ?? "re_swarm run";
			return `swarm-retry:${index + 1}: ${row} :: commands=${commands}`;
		})
		.slice(0, 24);
}

export function proofLoopSwarmBridgeFromItems(items: ProofLoopGapItem[], target?: string): string[] {
	const suffix = proofLoopCommandTarget(target);
	const retry = latestSwarmRetryQueue(target);
	const feedback = latestOperatorFeedback(target);
	const feedbackRows = feedback.rows
		.filter((row: any) => !/category=(strong_evidence|worker_retry_progress)/i.test(row))
		.map(
			(row: any, index: any) =>
				`operator_feedback:${index + 1} next="${feedback.commands[index] ?? "re_operator dispatch"}" row=${row}`,
		);
	const retryRows = retry.rows.map(
		(row: any, index: any) =>
			`retry_queue:${index + 1} source=swarm next="${retry.commands[index] ?? "re_swarm run"}" row=${row}`,
	);
	const grouped = new Map<DelegateWorker, ProofLoopGapItem[]>();
	for (const item of items) grouped.set(item.worker, [...(grouped.get(item.worker) ?? []), item]);
	const rows = [...grouped.entries()].map(([worker, items]) => {
		const contracts = delegateEvidenceContract(worker).join(" | ");
		const sources = Array.from(new Set(items.flatMap((item: any) => item.sourceArtifacts))).slice(0, 5);
		return `${worker}: gaps=${items.length} delegate="re_delegate plan${suffix}" swarm="re_swarm run${suffix} 2 1" swarm_merge="re_swarm merge" supervisor="re_supervisor repair${suffix}" evidence_contract=${contracts} sources=${sources.join(" | ") || "none"}`;
	});
	if (rows.length || retryRows.length || feedbackRows.length)
		return [...feedbackRows, ...retryRows, ...rows].slice(0, 16);
	return [
		`general: no active proof gaps; bridge standby -> re_swarm run${suffix} 2 1 && re_swarm merge && re_supervisor review${suffix}`,
	];
}

export function proofLoopSwarmBridge(target?: string): string[] {
	return proofLoopSwarmBridgeFromItems(proofLoopGapItems(target), target);
}
