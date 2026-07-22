/** Autofix reverse-domain next injection for empty failure/patch queues. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function seedAutofixReverseNextQueue(input: {
	nextOperatorQueue: string[];
	target?: string;
	replay: any;
	failures: any[];
	patchQueue: any[];
}): void {
	const reverseBlob = JSON.stringify({
		target: input.target ?? input.replay?.target,
		replay: input.replay,
		failures: input.failures,
		patchQueue: input.patchQueue,
		nextOperatorQueue: input.nextOperatorQueue,
	});
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|android|ios|dfir|pcap/i.test(
			reverseBlob,
		);
	if (reverseHeavy) {
		input.nextOperatorQueue.push(
			...reverseDomainCaptureNextCommands({
				routeOrBlob: reverseBlob,
				target: input.target ?? input.replay?.target,
			}),
		);
	} else {
		input.nextOperatorQueue.push("re_complete audit");
	}
	// reverse capture gate: completion needs proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready
}
