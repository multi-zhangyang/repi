/** Swarm worker runtime base scoring (non-reverse). */
import { truncateMiddle } from "../text.ts";
import { evidenceHitForPacket } from "./pure.ts";

export function scoreSwarmWorkerRuntimeBase(
	worker: any,
	swarm: any,
	ledger: string,
): {
	score: number;
	rationale: string[];
	conflicts: string[];
	evidenceGaps: string[];
	repairActions: string[];
	executions: any[];
	blocked: any[];
} {
	const executions = swarm.executions.filter((execution: any) => execution.workerId === worker.id);
	const blocked = executions.filter((execution: any) => execution.status === "blocked");
	const rationale: string[] = [];
	const conflicts: string[] = [];
	const evidenceGaps: string[] = [];
	const repairActions: string[] = [];
	let score = 50;
	if (executions.length > 0) {
		score += 15;
		rationale.push(`swarm worker executed ${executions.length} command(s)`);
	} else {
		score -= 15;
		evidenceGaps.push("swarm worker has no runtime execution yet");
		repairActions.push(`re_swarm run ${swarm.target ?? "<target>"} 1 1`);
	}
	if (worker.status === "done") {
		score += 25;
		rationale.push("swarm worker completed without blocked execution");
	}
	if (worker.status === "blocked" || blocked.length > 0) {
		score -= 35;
		conflicts.push(
			...blocked.map((execution: any) => `${execution.command}: ${truncateMiddle(execution.output, 180)}`),
		);
		repairActions.push(`re_swarm run ${swarm.target ?? "<target>"} 1 1`);
		repairActions.push("re_context pack");
	}
	if (swarm.workerResults.some((result: any) => result.includes(worker.id))) {
		score += 10;
		rationale.push("worker_results contains runtime merge row");
	} else {
		score -= 10;
		evidenceGaps.push("worker_results lacks runtime merge row");
	}
	if (swarm.mergeDigest.some((item: any) => item.includes(worker.id) || item.includes(`worker=${worker.worker}`))) {
		score += 10;
		rationale.push("merge_digest contains worker evidence");
	}
	if (
		swarm.executionAudit.some(
			(item: any) => item.includes(`worker=${worker.id}`) && /status=(covered|needs_evidence)/i.test(item),
		)
	) {
		score += 10;
		rationale.push("execution_audit contains worker runtime coverage row");
	} else {
		score -= 5;
		evidenceGaps.push("execution_audit lacks worker coverage row");
	}
	const workerCoverageRows = swarm.coverageMatrix.filter((item: any) => item.includes(`worker=${worker.id}`));
	const missingCoverageRows = workerCoverageRows.filter((item: any) => /status=missing/i.test(item));
	if (workerCoverageRows.length > 0 && missingCoverageRows.length === 0) {
		score += 10;
		rationale.push("coverage_matrix satisfies worker evidence contract");
	} else if (missingCoverageRows.length > 0) {
		score -= 10;
		evidenceGaps.push(`coverage_matrix missing ${missingCoverageRows.length} contract row(s)`);
	}
	const workerRetries = swarm.retryQueue.filter((item: any) => item.includes(`worker=${worker.id}`));
	if (workerRetries.length > 0) {
		score -= 10;
		repairActions.push(...workerRetries.slice(0, 3).map((item: any) => item.replace(/^.*\bnext=/, "")));
	}
	if (
		evidenceHitForPacket(
			{
				id: worker.id,
				worker: worker.worker,
				objective: worker.objective,
				status:
					worker.status === "done" || worker.status === "merged"
						? "done"
						: worker.status === "blocked"
							? "blocked"
							: "ready",
				phases: worker.mergeKeys
					.filter((key: string) => key.startsWith("phase="))
					.map((key: string) => key.replace(/^phase=/, "")),
				steps: worker.commands.map((command: string, index: number) => ({
					id: `${worker.id}:cmd:${index + 1}`,
					phase: "swarm",
					command,
					status: worker.status === "blocked" ? "blocked" : worker.status === "done" ? "done" : "ready",
					sourceArtifacts: worker.sourceArtifacts,
				})),
				evidenceContract: worker.evidenceContract,
				recommendedTools: worker.recommendedTools,
				handoffPrompt: worker.spawnPrompt,
				sourceArtifacts: worker.sourceArtifacts,
			},
			ledger,
		)
	) {
		score += 10;
		rationale.push("ledger contains swarm worker anchors");
	}
	if (worker.commands.length > 0 && (blocked.length > 0 || executions.length === 0))
		repairActions.push(...worker.commands.slice(0, 2));
	repairActions.push(`re_proof_loop run ${swarm.target ?? "<target>"} 4 2`);
	return { score, rationale, conflicts, evidenceGaps, repairActions, executions, blocked };
}
