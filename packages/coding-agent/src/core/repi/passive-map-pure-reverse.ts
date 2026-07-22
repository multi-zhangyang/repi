/** Passive map reverse domain next from signals. */
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function passiveMapReverseNextCommands(signals: string[], target?: string): string[] {
	const blob = signals.join("\n");
	if (!/(binary:|mitigation:|web:|mobile:|pwn:|elf|pe32|mach-o|android|frida|checksec|relro|nx|pie)/i.test(blob)) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target,
	}).slice(0, 4);
}
