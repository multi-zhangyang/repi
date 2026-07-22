/** Autopilot reverse capture stage footer. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function autopilotReverseCaptureFooter(params: {
	target?: string;
	route?: string;
	audit: string;
}): string | undefined {
	const reverseHeavyRun =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${params.target ?? ""} ${params.route ?? ""} ${params.audit}`,
		);
	if (reverseHeavyRun && !/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(params.audit)) {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${params.target ?? ""} ${params.route ?? ""} autopilot`,
			target: params.target,
			includeGates: true,
		}).slice(0, 4);
		return `## reverse_capture\n${reverseNext.map((cmd: any) => `- ${cmd}`).join("\n")}`;
	}
	return undefined;
}
