/** Map delegate packets to swarm worker runtimes. */
import type { SwarmWorkerRuntime } from "../types.ts";
import { swarmSpawnPrompt } from "./helpers.ts";
import { swarmDependencies, swarmMergeKeys } from "./plan.ts";

export function mapDelegatePacketsToSwarmWorkers(params: {
	delegate: any;
	target?: string;
	mode?: "plan" | "run" | "merge";
}): SwarmWorkerRuntime[] {
	const { delegate, target, mode } = params;
	return delegate.packets.map((packet: any, index: number) => {
		const readyCommands = packet.steps
			.filter((step: any) => step.status === "ready")
			.map((step: any) => step.command)
			.slice(0, 8);
		const commands = readyCommands.length
			? readyCommands
			: [`re_delegate show # inspect ${packet.id}`, `re_evidence search ${packet.worker}`];
		return {
			id: `swarm:${index + 1}:${packet.worker}`,
			worker: packet.worker,
			status:
				mode === "merge" && packet.status === "done" ? "merged" : packet.status === "blocked" ? "blocked" : "ready",
			objective: packet.objective,
			spawnPrompt: swarmSpawnPrompt(packet, delegate.target ?? target),
			commands,
			evidenceContract: packet.evidenceContract,
			mergeKeys: swarmMergeKeys(packet),
			dependencies: swarmDependencies(packet),
			recommendedTools: packet.recommendedTools,
			sourceArtifacts: packet.sourceArtifacts,
		};
	});
}

export function swarmParallelGroups(workers: SwarmWorkerRuntime[]): string[] {
	return [
		workers
			.filter((worker: any) => /web-authz|agentsec|cloud|identity/.test(worker.worker))
			.map((worker: any) => worker.id),
		workers
			.filter((worker: any) => /mobile-runtime|native-runtime|pwn-exploit|firmware-dfir|malware/.test(worker.worker))
			.map((worker: any) => worker.id),
		workers.filter((worker: any) => /reporting|general/.test(worker.worker)).map((worker: any) => worker.id),
	]
		.filter((group: any) => group.length > 0)
		.map((group: any, index: any) => `group:${index + 1} ${group.join(" ")}`);
}

export function swarmCollisionMatrix(workers: SwarmWorkerRuntime[], targetHint?: string): string[] {
	const collisionMatrix = workers.flatMap((worker, index) =>
		workers.slice(index + 1).flatMap((other: any) => {
			const overlap = worker.mergeKeys.filter((key: any) => other.mergeKeys.includes(key));
			return overlap.length ? [`${worker.id} <-> ${other.id}: ${overlap.join(",")}`] : [];
		}),
	);
	if (workers.length > 1 && collisionMatrix.length === 0) {
		collisionMatrix.push(
			`structured_conflict_arbitration_live_wiring: ${workers[0].id} <-> ${workers[1].id}: shared target=${targetHint ?? "unknown"} topic=final_claim_promotion`,
		);
	}
	return collisionMatrix.slice(0, 24);
}
