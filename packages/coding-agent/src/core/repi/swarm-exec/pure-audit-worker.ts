import { runtimeFailureLedgerPath, runtimeRepairQueuePath } from "../storage.ts";
import { swarmArtifactPath } from "../swarm-runtime.ts";
import { uniqueNonEmpty } from "../text.ts";

type SwarmArtifact = any;
type WorkerRuntimePoolWorkerV1 = any;
type RepiWorkerRetryHandoffClosureV1 = any;

export function workerPoolStatusPassed(status: WorkerRuntimePoolWorkerV1["status"]): boolean {
	return status === "done" || status === "passed";
}

export function workerPoolStatusFailed(status: WorkerRuntimePoolWorkerV1["status"]): boolean {
	return ["blocked", "failed", "timeout", "cancelled", "retry_queued", "exhausted"].includes(status);
}

export function workerRetryQueueRefsForSwarmWorker(swarm: SwarmArtifact, workerId: string): string[] {
	const refs = swarm.retryQueue.filter((row: any) => row.includes(`worker=${workerId}`));
	return uniqueNonEmpty(refs, 12);
}

export function workerHandoffRefsForSwarmWorker(swarm: SwarmArtifact, workerId: string): string[] {
	const manifests = (swarm.subagentRuntimeManifests ?? []).filter((manifest: any) => manifest.workerId === workerId);
	return uniqueNonEmpty(
		manifests.flatMap((manifest: any) => [
			manifest.runtimeManifestFile,
			manifest.stdoutPath,
			manifest.stderrPath,
			...manifest.evidenceRefs,
		]),
		24,
	);
}

export function workerRepairRefsForSwarmWorker(swarm: SwarmArtifact, workerId: string): string[] {
	const manifests = (swarm.subagentRuntimeManifests ?? []).filter((manifest: any) => manifest.workerId === workerId);
	const failed = swarm.executions.some(
		(execution: any) => execution.workerId === workerId && execution.status === "blocked",
	);
	return uniqueNonEmpty(
		[
			...manifests.flatMap((manifest: any) => [manifest.failureLedgerPath, manifest.repairQueuePath]),
			...(failed ? [runtimeFailureLedgerPath(), runtimeRepairQueuePath()] : []),
		],
		12,
	);
}

export function workerRetryHandoffState(params: {
	worker: WorkerRuntimePoolWorkerV1;
	retryQueueRefs: string[];
	handoffRefs: string[];
	repairRefs: string[];
}): RepiWorkerRetryHandoffClosureV1["workers"][number]["retryState"] {
	const { worker, retryQueueRefs, handoffRefs, repairRefs } = params;
	if (workerPoolStatusPassed(worker.status)) return "passed";
	if (!workerPoolStatusFailed(worker.status)) return "not_needed";
	if (worker.status === "exhausted") return repairRefs.length ? "exhausted_escalated" : "blocked_without_closure";
	if (retryQueueRefs.length && worker.retryBudget.remaining > 0) return "retry_queued";
	if (handoffRefs.length && worker.claimRefs.length) return "handoff_recovered";
	if (repairRefs.length) return worker.retryBudget.remaining > 0 ? "retry_queued" : "exhausted_escalated";
	return "blocked_without_closure";
}

export function evidenceHitForPacket(packet: any, ledger: string): boolean {
	const haystack = ledger.toLowerCase();
	const needles = [packet.worker, ...packet.phases, ...packet.evidenceContract]
		.map((item: any) => item.toLowerCase())
		.filter((item: any) => item.length > 3);
	return needles.some((needle: any) => haystack.includes(needle));
}

export function swarmWorkerChildSessionRuntimePath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-worker-child-session-runtime.json");
}

export function swarmSubagentSessionRoot(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-sessions");
}
