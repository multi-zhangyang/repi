/** Operator reverse domain next seeding. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function operatorReverseNextActions(target?: string, route?: string): string[] {
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			`${target ?? ""} ${route ?? ""}`,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${target ?? ""} ${route ?? ""} operator`,
		target,
		includeGates: true,
	}).slice(0, 4);
}
