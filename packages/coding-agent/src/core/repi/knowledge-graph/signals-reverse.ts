/** Knowledge-graph reverse next seed for runtime signals. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { uniqueNonEmpty } from "../text.ts";

export function knowledgeRuntimeReverseNextHints(input: { blob: string; hints?: string[] }): string[] {
	const reverseHeavy = /native|pwn|malware|firmware|reverse|binary|exploit|mobile|frida|proof_exit|bind_ready/i.test(
		input.blob,
	);
	if (!reverseHeavy) return input.hints ?? [];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: input.blob,
		includeGates: false,
	}).slice(0, 4);
	return uniqueNonEmpty([...(input.hints ?? []), ...reverseNext.map((c: any) => `reverse_domain_next:${c}`)], 24);
}
