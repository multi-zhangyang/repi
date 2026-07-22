/** Reverse next note for attack-graph evidence records. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function reverseEvidenceRecordNote(title: string, blob: string): string {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready|technique|frida|gdb|r2/i.test(
			`${title} ${blob}`,
		);
	if (!reverseHeavy) return title;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${title} ${blob}`,
		includeGates: true,
	}).slice(0, 3);
	return reverseNext.length ? `reverse_next: ${reverseNext.join(" | ")}` : title;
}
