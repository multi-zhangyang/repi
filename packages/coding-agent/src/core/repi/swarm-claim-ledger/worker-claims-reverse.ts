/** Reverse merge gate helpers for swarm worker claims. */
import { swarmReverseMergeClaimGate } from "../swarm-exec/reverse-pure.ts";

export type WorkerClaimReverseGate = ReturnType<typeof swarmReverseMergeClaimGate>;

export function evaluateWorkerClaimReverseGate(blob: string): WorkerClaimReverseGate {
	return swarmReverseMergeClaimGate(blob);
}

export function workerClaimReverseBlockReason(gate: WorkerClaimReverseGate): string {
	return gate.blocked ? `reverse_runtime_capture:${gate.reasons.join(",") || gate.proofExit}` : "";
}

export function workerClaimReverseNextCommand(gate: WorkerClaimReverseGate, target?: string): string {
	if (!gate.blocked) return "re_complete audit";
	return (
		gate.next.slice(0, 6).join(" && ") ||
		`re_domain_proof_exit show && re_runtime_adapter run ${target ?? "<target>"}`
	);
}

export function workerClaimReverseGateMeta(gate: WorkerClaimReverseGate):
	| {
			proofExit: string;
			bindReady: boolean;
			reasons: string[];
			release: unknown;
			next: string[];
	  }
	| undefined {
	if (!gate.blocked) return undefined;
	return {
		proofExit: gate.proofExit,
		bindReady: gate.bindReady,
		reasons: gate.reasons,
		release: gate.release,
		next: gate.next,
	};
}

export function buildWorkerClaimReverseBlob(input: {
	route?: string;
	target?: string;
	worker: { id: string; objective?: string; worker?: string; role?: string; commands?: unknown };
	executions: Array<{ command?: string; status?: string; output?: string; sourceArtifacts?: string[] }>;
}): string {
	const worker = input.worker;
	return [
		input.route ?? "",
		input.target ?? "",
		worker.id,
		String(worker.worker ?? worker.role ?? ""),
		String(worker.objective ?? ""),
		JSON.stringify(worker.commands ?? []),
		...input.executions.map((execution: any) =>
			[
				execution.command ?? "",
				execution.status ?? "",
				execution.output ?? "",
				JSON.stringify(execution.sourceArtifacts ?? []),
			].join("\n"),
		),
	].join("\n");
}
