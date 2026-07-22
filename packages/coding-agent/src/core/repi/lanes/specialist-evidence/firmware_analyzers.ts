/** Firmware/IoT specialist evidence analyzer. */
import type { LaneCommand, LaneCommandPack } from "../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../text.ts";
import { packHasSpecialistSignal } from "../self-heal.ts";
import {
	firmwareAnalyzerFollowups,
	firmwareAnalyzerNextLane,
	firmwareAnalyzerReverseNext,
} from "./firmware-analyzers-followups.ts";
import type { SpecialistEvidenceAnalysis } from "./types.ts";

export function analyzeFirmwareIotEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/firmware|iot/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /firmware-|Firmware[/]IoT rootfs|firmware-image|firmware-rootfs/i) ||
		/\.(?:bin|img|trx|chk|ubi|ubifs|squashfs|sqsh)$/i.test(pack.target ?? "");
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const buckets = {
		image: interestingLines(
			combined,
			/\[firmware-image\]|\[firmware-candidate\]|Squashfs|UBI|uImage|TRX|U-Boot|OpenWrt|entropy=|sha256=|binwalk|rootfs|kernel/i,
			24,
		),
		extract: interestingLines(
			combined,
			/\[firmware-extract\]|\[firmware-rootfs\]|\[firmware-extract-file\]|squashfs-root|unsquashfs-root|\/tmp\/repi-firmware-extract|ubi_reader|unblob/i,
			24,
		),
		config: interestingLines(
			combined,
			/\[firmware-config\]|\[firmware-secret\]|passwd|shadow|authorized_keys|id_rsa|\.pem|password|psk|ssid|nvram|token|secret/i,
			24,
		),
		service: interestingLines(
			combined,
			/\[firmware-service\]|\[firmware-init\]|\[firmware-web\]|\[firmware-surface\]|httpd|uhttpd|boa|lighttpd|dropbear|telnetd|inetd|cgi-bin|upnp|endpoint=/i,
			24,
		),
		emu: interestingLines(combined, /\[firmware-emulation\]|qemu-|chroot|arch=.*(?:MIPS|ARM)|service_smoke/i, 18),
	};
	if (buckets.image.length)
		findings.push(
			`Firmware image metadata anchors: ${buckets.image.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (buckets.extract.length)
		findings.push(
			`Firmware extraction/rootfs anchors: ${buckets.extract.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (buckets.config.length)
		findings.push(
			`Firmware config/secret anchors: ${buckets.config.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (buckets.service.length)
		findings.push(
			`Firmware service/web surface anchors: ${buckets.service.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (buckets.emu.length)
		findings.push(
			`Firmware emulation/runtime anchors: ${buckets.emu.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	if (findings.length) followups.push(...firmwareAnalyzerFollowups(targetArg));
	const reverseNext = firmwareAnalyzerReverseNext();
	return {
		findings,
		followups: Array.from(new Set([...followups, ...reverseNext])).slice(0, 16),
		nextLane: firmwareAnalyzerNextLane({
			image: buckets.image.length,
			extract: buckets.extract.length,
			config: buckets.config.length,
			service: buckets.service.length,
			emu: buckets.emu.length,
		}),
	} as any;
}
