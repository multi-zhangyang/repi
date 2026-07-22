/** Reverse-heavy context-pack next-command inject (domain-aware). */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function reverseContextResumeCommands(input: {
	mission?: unknown;
	route?: unknown;
	target?: unknown;
	repairQueue?: unknown;
}): string[] {
	const blob = JSON.stringify(input);
	const reverseHeavy =
		/proof_exit|pending_runtime_capture|bind_ready|native-runtime|pwn|malware|firmware|reverse_kind|native|binary|exploit|mobile|frida|gdb|frontend|js|browser|authz|web_authz|web \/ api|web pentest/i.test(
			blob,
		);
	if (!reverseHeavy) return [];
	const reverseCaptureMissing = !/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(blob);
	const target =
		typeof input.target === "string"
			? input.target
			: typeof (input as { mission?: { target?: string } }).mission?.target === "string"
				? (input as { mission?: { target?: string } }).mission?.target
				: undefined;
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target,
		includeGates: reverseCaptureMissing,
	});
}
