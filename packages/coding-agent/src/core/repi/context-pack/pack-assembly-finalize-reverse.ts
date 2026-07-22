/** Reverse next merge for context-pack finalize. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function mergeContextPackReverseNextCommands(
	route: string | undefined,
	target: string | undefined,
	nextCommands: string[] | undefined,
): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${route ?? ""} ${target ?? ""} ${(nextCommands ?? []).join(" ")}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${route ?? ""} ${target ?? ""}`,
				target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return Array.from(new Set([...(nextCommands ?? []), ...reverseNext])).slice(0, 24);
}
