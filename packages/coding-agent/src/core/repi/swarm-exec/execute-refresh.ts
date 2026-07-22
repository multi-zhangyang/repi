/** Swarm run derived-field refresh with reverse signals. */

import { swarmPlanCoverage } from "../swarm-runtime/build/plan-coverage.ts";
import { refreshSwarmRuntimeClaimLedger } from "../swarm-runtime/deps.ts";
import { swarmReleaseCheckMetadata } from "../swarm-runtime/release.ts";
import { truncateMiddle } from "../text.ts";
import { deriveSwarmAuditFields } from "./pure.ts";
import { swarmReverseQuerySignals } from "./reverse-pure.ts";

type SwarmArtifact = any;
type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;

export function refreshSwarmRunDerivedFields(swarm: SwarmArtifact): SwarmArtifact {
	const executionsByWorker = new Map<string, SwarmWorkerExecution[]>();
	for (const execution of swarm.executions)
		executionsByWorker.set(execution.workerId, [...(executionsByWorker.get(execution.workerId) ?? []), execution]);
	const workers = swarm.workers.map((worker: any) => {
		const executions = executionsByWorker.get(worker.id) ?? [];
		if (executions.length === 0) return worker;
		const status: SwarmWorkerRuntime["status"] = executions.some((execution: any) => execution.status === "blocked")
			? "blocked"
			: "done";
		return {
			...worker,
			status,
		};
	});
	const blocked = swarm.executions
		.filter((execution: any) => execution.status === "blocked")
		.map((execution: any) => `${execution.workerId} ${execution.command} — ${truncateMiddle(execution.output, 220)}`);
	const workerResults = workers.map((worker: any) => {
		const executions = executionsByWorker.get(worker.id) ?? [];
		const last = executions.at(-1);
		return `${worker.id} worker=${worker.worker} status=${worker.status} executed=${executions.length} evidence=${worker.evidenceContract.join(" | ")} last=${last ? truncateMiddle(last.output.replace(/\s+/g, " "), 220) : "none"}`;
	});
	const mergeDigest = Array.from(
		new Set([
			`mode=${swarm.mode} workers=${workers.length} executed=${swarm.executions.length} blocked=${blocked.length}`,
			...workerResults,
			...blocked.map((item: any) => `repair: ${item}`),
			...swarm.collisionMatrix.map((item: any) => `collision: ${item}`),
			...swarmReverseQuerySignals(
				[
					swarm.target,
					swarm.route,
					...workers.map((w: any) => (w.evidenceContract ?? []).join(" ")),
					...swarm.executions.map((e: any) => e.output ?? ""),
				].join("\n"),
			).map((s: any) => `reverse_signal: ${s}`),
		]),
	).slice(0, 32);
	const auditFields = deriveSwarmAuditFields({
		...swarm,
		workers,
		blocked,
		workerResults,
		mergeDigest,
		executionAudit: [],
		coverageMatrix: [],
		retryQueue: [],
	});
	const target = swarm.target ?? "<target>";
	const refreshedForPlan = {
		...swarm,
		workers,
		blocked,
		workerResults,
		mergeDigest,
		executionAudit: auditFields.executionAudit,
		coverageMatrix: auditFields.coverageMatrix,
		retryQueue: auditFields.retryQueue,
	};
	const planCoverage = swarmPlanCoverage(refreshedForPlan);
	const releaseCheckMetadata = swarmReleaseCheckMetadata(swarm.parallelPlan);
	const commanderNextActions = Array.from(
		new Set([
			...auditFields.retryQueue
				.flatMap((item: any) => item.match(/next=([^&;]+)/i)?.[1]?.trim() ?? [])
				.filter((item: any) => /^re[-_]/i.test(item)),
			...(blocked.length ? [`re_supervisor repair ${target}`, "re_autofix plan", "re_operator escalate"] : []),
			"re_swarm merge",
			"re_supervisor review",
			"re_verifier matrix",
			`re_proof_loop run ${target} 4 2`,
			"re_context pack",
		]),
	).slice(0, 18);
	return refreshSwarmRuntimeClaimLedger({
		...swarm,
		workers,
		blocked,
		workerResults,
		mergeDigest,
		...auditFields,
		planCoverage,
		releaseCheckMetadata,
		commanderNextActions,
		sourceArtifacts: Array.from(
			new Set(
				[
					...swarm.sourceArtifacts,
					...swarm.executions.flatMap((execution: any) => execution.sourceArtifacts),
					...(swarm.subagentRuntimeManifests ?? []).flatMap((manifest: any) => [
						manifest.runtimeManifestFile,
						manifest.stdoutPath,
						manifest.stderrPath,
					]),
					swarm.subagentRuntimeManifestPath,
				].filter((item): item is string => Boolean(item)),
			),
		).slice(0, 64),
	});
}
