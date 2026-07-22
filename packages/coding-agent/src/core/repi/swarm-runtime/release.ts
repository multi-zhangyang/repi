import { parseSwarmArtifact } from "../graph-artifacts/swarm.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ReconParallelPlanV1 } from "../runtime-types.ts";
import { operatorCommandConcrete } from "./deps.ts";
import { latestSwarmArtifactPath, swarmArtifactPath } from "./paths.ts";
/** Swarm release checks and runtime refresh helpers. */
import type { SwarmArtifact } from "./types.ts";

export function swarmClaimLedgerPath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-claim-ledger.jsonl");
}

export function swarmReleaseCheckMetadata(plan?: ReconParallelPlanV1): string[] {
	const reverseRelease = [
		"reverse_release:require technique query anchors or reverse_kind",
		"reverse_release:require proof_exit before claim promotion",
		"reverse_release:require reverse.bind_ready=true or runtime capture strong/partial",
		"reverse_release:block technique without domain_proof_exit/matched proof_exit",
	];
	if (!plan) {
		return [...reverseRelease, "release_check.parallel_plan_present=false", "release_check.next=re_swarm plan"];
	}
	const planBlob = JSON.stringify(plan ?? {});
	const reverseHeavy =
		/reverse_proof_bias/.test(String(plan.strategy ?? "")) ||
		/reverse|pwn|native|malware|firmware|mobile|frontend|js|browser|authz|proof_exit|bind_ready|technique/.test(
			planBlob,
		) ||
		/reverse\.bind_ready=false|proof_exit=pending_runtime_capture|reverse_proof_gate|pending_runtime_capture/.test(
			String((plan as any).notes ?? (plan as any).releaseNotes ?? planBlob),
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: planBlob,
				target: (plan as any).target ?? (plan as any).workers?.[0]?.target,
			}).join("|")
		: "";
	return [
		...reverseRelease,
		"release_check.parallel_plan_present=true",
		`release_check.parallel_plan_id=${plan.planId}`,
		`release_check.source=${plan.source}`,
		`release_check.worker_count=${plan.workers.length}`,
		`release_check.worker_required_fields=id,role,objective,commands,evidenceContract,mergeKeys,dependencies,artifactGlobs,limits`,
		`release_check.merge_strategy=${plan.merge.strategy}`,
		`release_check.evidence_order=${plan.merge.evidenceOrder.join(">")}`,
		`release_check.reverse_proof_bias=${reverseHeavy}`,
		`release_check.reverse_claim_promotion=${reverseHeavy ? "blocked_until_runtime_capture_and_bind_ready" : "blocked_until_supervisor_claim_check_passes"}`,
		"release_check.claim_promotion=blocked_until_supervisor_claim_check_passes",
		...(reverseHeavy
			? [
					"release_check.reverse_required=proof.exit=partial_runtime_capture|runtime_capture_strong",
					"release_check.reverse_required=bind_ready=true",
					`release_check.next=${reverseNext}`,
				]
			: []),
	];
}

export function latestSwarmRetryQueue(target?: string): { path?: string; rows: string[]; commands: string[] } {
	const path = (latestSwarmArtifactPath as any)(
		target ? { target, requestedBy: "swarm_retry_queue_latest_artifact_consumer" } : {},
	);
	const swarm = path ? parseSwarmArtifact(path) : undefined;
	if (!swarm) return { path, rows: [], commands: [] };
	if (target && swarm.target && target !== swarm.target) return { path, rows: [], commands: [] };
	const concreteTarget = target ?? swarm.target;
	const rows = Array.from(new Set((swarm.retryQueue as any[]) ?? [])).slice(0, 32) as string[];
	const commands = rows
		.flatMap((row: any) => /\bnext=(.+)$/i.exec(row)?.[1]?.trim() ?? "")
		.flatMap(splitRetryNextCommands)
		.map((command: any) => operatorCommandConcrete(command, concreteTarget).command)
		.filter((command: any) => /^re[-_]/i.test(command))
		.filter((command: any) => !/^re[-_]operator\s+dispatch\b/i.test(command));
	return { path, rows, commands: Array.from(new Set(commands)).slice(0, 12) as string[] };
}

const _RECON_PARALLEL_EVIDENCE_ORDER = [
	"same_window_live",
	"runtime_artifact",
	"network",
	"served_asset",
	"process_config",
	"persisted_state",
];

export function splitRetryNextCommands(text: string): string[] {
	return String(text || "")
		.split(/\s*(?:,|;|&&|\|\|)\s*/)
		.map((item: any) => item.trim())
		.filter(Boolean);
}
