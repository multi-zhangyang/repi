/** Reverse-heavy knowledge-graph capture commands (domain-aware). */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function reverseKnowledgeCaptureCommands(input: unknown): string[] {
	const blob = JSON.stringify(input ?? {});
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|checksec|gdb|frida/i.test(
			blob,
		);
	if (!reverseHeavy) return [];
	const reverseCaptureMissing = !/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(blob);
	const target =
		typeof (input as { target?: string } | null)?.target === "string"
			? (input as { target?: string }).target
			: undefined;
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target,
		includeGates: reverseCaptureMissing,
	});
}
