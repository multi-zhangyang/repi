/** Proof-loop reverse domain next footer. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { writeProofLoopArtifact } from "./build-core.ts";
import { formatProofLoop } from "./format.ts";

export function finalizeProofLoopOutput(proof: any, options: { target?: string } = {}): string {
	const path = writeProofLoopArtifact(proof);
	const base = formatProofLoop(proof, path);
	const reverseOpen =
		/pending_runtime_capture|bind_ready\s*=\s*false|proof_exit\s*=\s*pending|reverse_proof_exit|verdict":"(?!ready)/i.test(
			JSON.stringify(proof ?? {}),
		) ||
		(proof.verdict && proof.verdict !== "ready");
	if (!reverseOpen) return base;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${proof.verdict ?? ""} ${(proof as any).gapClassifier?.join?.(" ") ?? ""} reverse`,
		target: options.target ?? proof.target,
		includeGates: true,
	}).slice(0, 4);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}
