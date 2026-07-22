/** Reverse next commands from runtime adapter target profile. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { RuntimeAdapterTargetProfileV1 } from "./types.ts";

export function reverseTargetInspectNextCommands(profile: RuntimeAdapterTargetProfileV1): string[] {
	const blob = [
		profile.target,
		...(profile.adapterIds ?? []),
		...(profile.targetKinds ?? []),
		...(profile.signals ?? []).map((s: any) => `${s.adapterId} ${s.targetKind} ${s.reason}`),
	].join("\n");
	if (!/(native|elf|pe32|mach-o|pwn|frida|gdb|r2|pcap|firmware|mobile|apk|browser|http|authz)/i.test(blob)) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target: profile.target || undefined,
		includeGates: true,
	}).slice(0, 4);
}
