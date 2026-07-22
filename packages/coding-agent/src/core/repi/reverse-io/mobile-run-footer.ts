/** Mobile runtime reverse proof footer lines. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function mobileRuntimeReverseFooter(params: {
	anchors: string[];
	target?: string;
	packageName?: string;
}): string[] {
	const proofExit =
		params.anchors.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		params.anchors.find((line: any) => /^query\.proof_exit=/.test(line))?.replace(/^query\.proof_exit=/, "") ||
		params.anchors
			.find((line: any) => /^summary\.runtime_proof_exit=/.test(line))
			?.replace(/^summary\.runtime_proof_exit=/, "") ||
		"pending_runtime_capture";
	const reverseReady = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit);
	if (reverseReady) {
		return [`proof.exit=${proofExit}`, "bind_ready=true", "reverse_proof_gate=require_proof_exit_before_claim"];
	}
	return [
		`proof.exit=${proofExit}`,
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: `mobile ${params.target ?? params.packageName ?? ""} ${params.anchors.join("\n")}`,
			target: params.target ?? params.packageName,
			includeGates: true,
		}).map((cmd: any) => `next: ${cmd}`),
	];
}
