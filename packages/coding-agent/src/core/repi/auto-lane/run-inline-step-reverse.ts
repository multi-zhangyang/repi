/** Auto-lane inline reverse next sections. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function autoLaneInlineReverseSections(params: {
	laneName: string;
	objective?: string;
	text: string;
	target?: string;
}): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|reverser|proof_exit|bind_ready/i.test(
			`${params.laneName} ${params.objective ?? ""} ${params.text}`,
		);
	if (!reverseHeavy) return [];
	if (/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(params.text)) return [];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${params.laneName} ${params.objective ?? ""}`,
		target: params.target,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return [];
	return [`reverse_next:\n${reverseNext.map((c: any) => `- ${c}`).join("\n")}`];
}
