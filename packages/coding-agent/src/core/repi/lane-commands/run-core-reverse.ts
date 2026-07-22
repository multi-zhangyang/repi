/** Lane run reverse gate footer. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function laneRunReverseGateLines(pack: any, effectivePack: any): string[] {
	return [
		"## Reverse Gate",
		"",
		"- require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready before claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: JSON.stringify({ pack: effectivePack, target: pack?.target ?? effectivePack?.target }),
			target: pack?.target ?? effectivePack?.target,
			includeGates: true,
		}).map((cmd: any) => `- next: ${cmd}`),
	];
}
