/** Supervisor reverse domain next seeding. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function supervisorReverseNextActions(params: {
	target?: string;
	delegateTarget?: string;
	blob: string;
}): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|frida|checksec|gdb/i.test(
			params.blob,
		);
	if (!reverseHeavy) return [];
	return reverseDomainCaptureNextCommands({
		routeOrBlob: params.blob,
		target: params.target ?? params.delegateTarget,
		includeGates: true,
	}).slice(0, 4);
}
