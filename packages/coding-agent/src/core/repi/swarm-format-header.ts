/** Swarm format header/workers/exec/merge sections. */

import type { SwarmFormatView } from "./swarm-format-types.ts";
import { truncateMiddle } from "./text.ts";

export function formatSwarmHeaderSections(swarm: SwarmFormatView, path?: string): Array<string | undefined> {
	return [
		"swarm_plan:",
		path ? `swarm_artifact: ${path}` : undefined,
		`timestamp: ${swarm.timestamp}`,
		`mode: ${swarm.mode}`,
		`mission_id: ${swarm.missionId ?? "none"}`,
		`route: ${swarm.route ?? "none"}`,
		`target: ${swarm.target ?? "<none>"}`,
		`delegation_artifact: ${swarm.delegationArtifact ?? "none"}`,
		"worker_runtime_packets:",
		...(swarm.workers.length
			? swarm.workers.flatMap((worker: any) => [
					`- ${worker.id} [${worker.status}] worker=${worker.worker}`,
					`  objective: ${worker.objective}`,
					`  dependencies: ${worker.dependencies.join(", ") || "none"}`,
					`  merge_keys: ${worker.mergeKeys.join(" | ")}`,
					`  evidence_contract: ${worker.evidenceContract.join(" | ")}`,
					`  spawn_prompt: ${worker.spawnPrompt.join(" ; ")}`,
					`  commands: ${worker.commands.join(" || ")}`,
				])
			: ["- none"]),
		`worker_executions: ${swarm.executions.length}`,
		...(swarm.executions.length
			? swarm.executions.map(
					(execution: any) =>
						`- ${execution.workerId} [${execution.status}] worker=${execution.worker} command=${execution.command} :: ${truncateMiddle(execution.output.replace(/\s+/g, " "), 260)}`,
				)
			: []),
		"worker_results:",
		...(swarm.workerResults.length ? swarm.workerResults.map((item: any) => `- ${item}`) : ["- none"]),
		"blocked:",
		...(swarm.blocked.length ? swarm.blocked.map((item: any) => `- ${item}`) : ["- none"]),
		"merge_digest:",
		...(swarm.mergeDigest.length ? swarm.mergeDigest.map((item: any) => `- ${item}`) : ["- none"]),
		"execution_audit:",
		...(swarm.executionAudit.length ? swarm.executionAudit.map((item: any) => `- ${item}`) : ["- none"]),
		"coverage_matrix:",
		...(swarm.coverageMatrix.length ? swarm.coverageMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"retry_queue:",
		...(swarm.retryQueue.length ? swarm.retryQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"parallel_groups:",
		...(swarm.parallelGroups.length ? swarm.parallelGroups.map((item: any) => `- ${item}`) : ["- none"]),
		"merge_protocol:",
		...(swarm.mergeProtocol.length ? swarm.mergeProtocol.map((item: any) => `- ${item}`) : ["- none"]),
		"collision_matrix:",
		...(swarm.collisionMatrix.length ? swarm.collisionMatrix.map((item: any) => `- ${item}`) : ["- none"]),
		"evidence_contract:",
		...(swarm.evidenceContract.length ? swarm.evidenceContract.map((item: any) => `- ${item}`) : ["- none"]),
		"commander_next_actions:",
		...(swarm.commanderNextActions.length
			? swarm.commanderNextActions.map((item: any) => `- ${item}`)
			: ["- re_supervisor review"]),
		"handoff_digest:",
		...(swarm.handoffDigest.length ? swarm.handoffDigest.map((item: any) => `- ${item}`) : ["- none"]),
		"parallel_plan:",
		...(swarm.parallelPlan
			? [
					`- plan_id=${swarm.parallelPlan.planId}`,
					`- source=${swarm.parallelPlan.source}`,
					`- workers=${(swarm.parallelPlan.workers as any[])?.length ?? 0}`,
					`- parallel_mode=${
						swarm.executions.some((execution: any) => /^re[-_]/i.test(execution.command))
							? "simulated_sequential_for_internal_repi_commands"
							: "child_process_for_shell_commands"
					}`,
					`- isolation=${
						swarm.executions.some((execution: any) =>
							/isolation=shared-process-internal-dispatch/i.test(execution.output),
						)
							? "shared-process-internal-dispatch"
							: "subprocess-shell"
					}`,
					`- merge=${(swarm.parallelPlan.merge as any)?.strategy}`,
				]
			: ["- none"]),
		"plan_coverage:",
		...(swarm.planCoverage.length ? swarm.planCoverage.map((item: any) => `- ${item}`) : ["- none"]),
		"release_check_metadata:",
		...(((swarm.releaseCheckMetadata as any[] | undefined)?.length ?? 0)
			? ((swarm.releaseCheckMetadata as any[]) ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"runtime_claim_ledger:",
		`- path=${swarm.claimLedgerPath ?? "pending"}`,
		`- events=${swarm.claimLedgerEventCount}`,
		`- tip_hash=${swarm.claimLedgerTipHash ?? "none"}`,
		`- hash_chain=${swarm.runtimeClaimLedgerCaptured ? "pass" : "fail"}`,
		...(((swarm.claimLedger as any[] | undefined)?.length ?? 0)
			? ((swarm.claimLedger as any[]) ?? [])
					.slice(0, 10)
					.map(
						(event: any) =>
							`- seq=${event.seq} type=${event.type} claim=${event.claimId ?? "none"} status=${event.status ?? "n/a"} hash=${String(event.eventHash ?? "").slice(0, 16)}`,
					)
			: ["- none"]),
	];
}
