/** Swarm worker command reverse next notes. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function swarmExecuteReverseNotes(params: {
	worker: any;
	command: string;
	status: string;
	output: string;
}): string[] {
	if (params.status !== "blocked" && params.status !== "failed") return [];
	const blob = `${params.worker?.worker ?? params.worker?.id ?? ""} ${params.command} ${params.output}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready|frida/i.test(
			blob,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target: params.worker?.target,
		includeGates: true,
	})
		.slice(0, 2)
		.map((cmd: any) => `reverse_next: ${cmd}`);
}
