/** Worker handoff merge reverse next seeding. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function workerHandoffReverseNext(params: {
	workerClosures: any[];
	unresolvedWorkers: string[];
	unresolvedCollisions: string[];
}): string[] {
	const reverseBlob = [
		...params.workerClosures.map(
			(worker: any) => `${worker.workerId ?? ""} ${worker.closure ?? ""} ${worker.nextAction ?? ""}`,
		),
		...params.unresolvedWorkers,
		...params.unresolvedCollisions,
	].join(" ");
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|frida|gdb|r2/i.test(
			reverseBlob,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		includeGates: true,
	}).slice(0, 4);
}
