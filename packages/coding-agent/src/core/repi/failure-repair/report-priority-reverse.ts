/** Reverse next commands for failure signature priority reports. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function failurePriorityReverseNextCommands(
	target: string | undefined,
	failures: Array<{ category?: string; source?: string; signature?: string; failedChecks?: string[] }>,
): string[] {
	const reverseHeavy = failures.some((failure: any) =>
		/proof_exit|domain_proof_exit|reverse_proof|pending_runtime_capture|bind_ready|native|pwn|malware|firmware|mobile|browser|authz|web|frida|checksec|gdb/i.test(
			`${failure.category} ${failure.source} ${failure.signature} ${(failure.failedChecks || []).join(" ")}`,
		),
	);
	if (!reverseHeavy) return [];
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${target ?? ""} failure_signature_priority`,
		target,
		includeGates: true,
	}).slice(0, 3);
}
