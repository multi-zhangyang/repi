/** JS signing reverse domain next footer. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function jsSigningReverseFooter(params: {
	target?: string;
	output: string;
	proofExit?: string;
	reverseReady?: boolean;
	anchors?: string[];
}): string {
	const proofExit =
		params.proofExit ??
		/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.exec(params.output)?.[1] ??
		"pending_runtime_capture";
	const reverseReady = params.reverseReady ?? /^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit);
	const reverseFooter = reverseReady
		? [`proof.exit=${proofExit}`, "bind_ready=true", "reverse_proof_gate=require_proof_exit_before_claim"]
		: [
				`proof.exit=${proofExit}`,
				"bind_ready=false",
				"reverse_proof_gate=require_proof_exit_before_claim",
				...reverseDomainCaptureNextCommands({
					routeOrBlob: `frontend js signing ${params.target ?? ""} ${(params.anchors ?? []).join("\n")}`,
					target: params.target,
					includeGates: true,
				}).map((cmd: any) => `next: ${cmd}`),
			];
	return [params.output, ...reverseFooter].filter(Boolean).join("\n");
}
