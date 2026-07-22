/** Swarm reverse capture next/release helpers. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function swarmReverseHeavyBlob(blob: unknown): boolean {
	return /native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|web-authz|bind_ready|proof_exit|pending_runtime_capture|frida|checksec|gdb/i.test(
		typeof blob === "string" ? blob : JSON.stringify(blob ?? {}),
	);
}

export function swarmReverseNextCommands(input: { routeOrBlob: unknown; target?: string }): string[] {
	return reverseDomainCaptureNextCommands({
		routeOrBlob: typeof input.routeOrBlob === "string" ? input.routeOrBlob : JSON.stringify(input.routeOrBlob ?? {}),
		target: input.target,
	});
}

export function swarmReverseHasStrongCapture(blob: unknown): boolean {
	const text = typeof blob === "string" ? blob : JSON.stringify(blob ?? {});
	return (
		/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(text) ||
		/proof\.exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(text)
	);
}
