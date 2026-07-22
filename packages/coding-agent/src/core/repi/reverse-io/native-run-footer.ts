/** Native runtime reverse proof footer from anchors. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function nativeProofExitFromAnchors(anchors: string[]): string {
	return (
		anchors.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		anchors.find((line: any) => /^query\.proof_exit=/.test(line))?.replace(/^query\.proof_exit=/, "") ||
		anchors
			.find((line: any) => /^summary\.runtime_proof_exit=/.test(line))
			?.replace(/^summary\.runtime_proof_exit=/, "") ||
		"pending_runtime_capture"
	);
}

export function nativeReverseFooter(proofExit: string, target: string | undefined, anchors: string[]): string[] {
	const reverseReady = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit);
	if (reverseReady) {
		return [`proof.exit=${proofExit}`, "bind_ready=true", "reverse_proof_gate=require_proof_exit_before_claim"];
	}
	return [
		`proof.exit=${proofExit}`,
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: `native ${target ?? ""} ${anchors.join("\n")}`,
			target,
			includeGates: true,
		}).map((cmd: any) => `next: ${cmd}`),
		// Host-tool bootstrap only when still missing common CAP surrogates in anchors.
		...(/checksec=0|rop=0|frida=0/i.test(anchors.join(" "))
			? ["next: re_bootstrap plan checksec gdb ROPgadget"]
			: []),
	];
}
