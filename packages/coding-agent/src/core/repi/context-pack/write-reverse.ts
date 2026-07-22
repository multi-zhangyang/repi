/** Context-pack write reverse next merge. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ContextPackArtifact } from "./types.ts";

export function withContextPackWriteReverseNext(pack: ContextPackArtifact): ContextPackArtifact {
	const reverseBlob = `${pack.route ?? ""} ${pack.target ?? ""} ${(pack.nextCommands ?? []).join(" ")}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		)
	) {
		return pack;
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: pack.target,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return pack;
	return {
		...pack,
		nextCommands: Array.from(new Set([...(pack.nextCommands ?? []), ...reverseNext])).slice(0, 24),
	};
}
