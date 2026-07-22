/** Build swarm parallel plan. */

import type { DelegateArtifact } from "../../delegate.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { ReconParallelPlanV1 } from "../../runtime-types.ts";
import type { SwarmWorkerRuntime } from "../types.ts";
import { swarmArtifactGlobs } from "./plan-coverage.ts";

const RECON_PARALLEL_EVIDENCE_ORDER = [
	"same_window_live",
	"runtime_artifact",
	"network",
	"served_asset",
	"process_config",
	"persisted_state",
];

export function buildSwarmParallelPlan(params: {
	delegate: DelegateArtifact;
	delegationArtifact?: string;
	workers: SwarmWorkerRuntime[];
	timestamp: string;
	target?: string;
	mode?: "plan" | "run" | "merge";
}): ReconParallelPlanV1 {
	const { delegate, delegationArtifact, workers, timestamp } = params;
	const target = delegate.target ?? params.target;
	const planIdBase = delegate.missionId ?? `swarm-${timestamp.replace(/[:.]/g, "-")}`;
	const reverseHeavy = workers.some((worker: any) =>
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|technique|repro|mitre|cwe|capture/i.test(
			`${worker.worker} ${worker.objective} ${worker.commands.join(" ")} ${worker.evidenceContract.join(" ")}`,
		),
	);
	const strategyBase =
		params.mode === "run"
			? "execute_ready_workers"
			: params.mode === "merge"
				? "merge_worker_claims"
				: "plan_parallel_workers";
	const strategy = reverseHeavy ? `${strategyBase}:reverse_proof_bias` : strategyBase;
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${target ?? ""} ${workers.map((w: any) => w.worker).join(" ")} swarm_parallel_plan`,
				target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const planWorkers = workers.map((worker: any) => ({
		id: worker.id,
		role: worker.worker,
		objective: worker.objective,
		commands: Array.from(new Set([...reverseNext, ...worker.commands])).slice(0, 12),
		evidenceContract: worker.evidenceContract,
		mergeKeys: worker.mergeKeys,
		dependencies: worker.dependencies,
		artifactGlobs: swarmArtifactGlobs(worker, delegationArtifact),
		limits: {
			maxCommands: 8,
			status: worker.status,
		},
		prompt: worker.spawnPrompt,
		sourceWorkerId: worker.id,
	}));
	return {
		kind: "ReconParallelPlanV1",
		schemaVersion: 1,
		planId: `${planIdBase}:${params.mode ?? "plan"}`,
		target,
		source: "re_swarm",
		strategy,
		workers: planWorkers,
		merge: {
			strategy: reverseHeavy ? "claim-ledger" : "supervisor",
			evidenceOrder: RECON_PARALLEL_EVIDENCE_ORDER,
			expectedArtifacts: Array.from(
				new Set(
					[
						delegationArtifact,
						...workers.flatMap((worker: any) => worker.sourceArtifacts),
						"memory/evidence-ledger.md",
					].filter((item): item is string => Boolean(item)),
				),
			).slice(0, 24),
			command: reverseHeavy ? "re_supervisor review && re_complete audit" : "re_supervisor review",
			conflictPolicy: reverseHeavy
				? "prefer_runtime_capture_and_proof_exit_before_claim"
				: "prefer_runtime_replay_verifier_evidence",
		},
	};
}
