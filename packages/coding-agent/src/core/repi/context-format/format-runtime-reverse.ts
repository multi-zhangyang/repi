/** Context-pack format reverse next lines. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPackReverseNextLines(pack: ContextPackFormatView): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${pack.route ?? ""} ${pack.target ?? ""} ${((pack.nextOperatorCommands ?? pack.nextCommands ?? []) as any[]).join(" ")}`,
		);
	if (!reverseHeavy) return [];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${pack.route ?? ""} ${pack.target ?? ""}`,
		target: pack.target,
		includeGates: true,
	}).slice(0, 3);
	return reverseNext.length ? ["reverse_next:", ...reverseNext.map((cmd: any) => `- ${cmd}`)] : [];
}
