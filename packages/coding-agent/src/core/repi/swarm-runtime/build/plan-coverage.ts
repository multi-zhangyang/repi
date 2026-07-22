/** Swarm plan coverage/merge/deps/globs. */

import { slug } from "../../text.ts";
import type { SwarmArtifact, SwarmWorkerRuntime } from "../types.ts";

export function swarmPlanCoverage(
	swarm: Pick<SwarmArtifact, "workers" | "parallelPlan" | "coverageMatrix" | "collisionMatrix">,
): string[] {
	const plan = swarm.parallelPlan;
	if (!plan) return ["parallel_plan=missing status=fail next=re_swarm plan"];
	const workerIds = new Set(swarm.workers.map((worker: any) => worker.id));
	const planWorkerIds = new Set(plan.workers.map((worker: any) => worker.id));
	const missingFromPlan = [...workerIds].filter((id: any) => !planWorkerIds.has(id));
	const orphanPlanWorkers = [...planWorkerIds].filter((id: any) => !workerIds.has(id));
	const contractRows = plan.workers.map((worker: any) => {
		const coverageRows = swarm.coverageMatrix.filter((row: any) => row.includes(`worker=${worker.id}`));
		const missingRows = coverageRows.filter((row: any) => /status=missing/i.test(row));
		return `worker=${worker.id} contract=${worker.evidenceContract.length} coverage_rows=${coverageRows.length} missing=${missingRows.length}`;
	});
	return [
		`parallel_plan_id=${plan.planId}`,
		`parallel_plan_source=${plan.source}`,
		`parallel_plan_workers=${plan.workers.length} swarm_workers=${swarm.workers.length}`,
		`worker_binding=${missingFromPlan.length || orphanPlanWorkers.length ? "fail" : "pass"}`,
		`missing_from_plan=${missingFromPlan.join(",") || "none"}`,
		`orphan_plan_workers=${orphanPlanWorkers.join(",") || "none"}`,
		`merge_strategy=${plan.merge.strategy}`,
		`evidence_order=${plan.merge.evidenceOrder.join(">")}`,
		`collision_rows=${swarm.collisionMatrix.length}`,
		...contractRows,
	].slice(0, 48);
}

export function swarmMergeKeys(packet: any): string[] {
	return Array.from(
		new Set([
			`worker=${packet.worker}`,
			...packet.phases.map((phase: any) => `phase=${phase}`),
			...packet.evidenceContract.map((item: any) => `evidence=${slug(item).slice(0, 32)}`),
		]),
	).slice(0, 14);
}

export function swarmDependencies(packet: any): string[] {
	const deps = new Set<string>();
	for (const step of packet.steps) {
		if (/re_map|passive map/i.test(step.command)) deps.add("passive_map_done");
		if (/re_lane plan|repro/i.test(step.command)) deps.add("repro_commands_ready");
		if (/re_lane run|run-auto|runtime|proof/i.test(step.command)) deps.add("minimal_path_proven");
		if (/re_verifier/i.test(step.command)) deps.add("verifier_matrix_ready");
		if (/re_compiler|report/i.test(step.command)) deps.add("compiler_ready");
		if (/re_replayer|replay/i.test(step.command)) deps.add("replay_ready");
		if (/re_autofix|repair/i.test(step.command)) deps.add("autofix_ready");
	}
	if (deps.size === 0) deps.add("delegation_packets_ready");
	return Array.from(deps).slice(0, 10);
}

export function swarmArtifactGlobs(worker: SwarmWorkerRuntime, delegationArtifact?: string): string[] {
	return Array.from(
		new Set(
			[
				delegationArtifact,
				...worker.sourceArtifacts,
				"memory/evidence-ledger.md",
				"memory/commander-merge-board.md",
				"recon/evidence/**",
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 16);
}
