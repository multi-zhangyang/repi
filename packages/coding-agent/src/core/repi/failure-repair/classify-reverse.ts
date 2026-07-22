/** Failure reverse domain next commands. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function reverseFailureNextCommands(reason: string, target?: string): string[] {
	if (
		!/proof_exit|domain_proof_exit|reverse_proof|pending_runtime_capture|bind_ready|technique|mitre|cwe|native|pwn|frida|gdb|r2/i.test(
			reason,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: reason,
		target,
	}).slice(0, 4);
}
