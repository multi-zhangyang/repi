/** Firmware analyzer followups + nextLane from captured line buckets. */

import type { LaneCommand } from "../../lane-commands/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function firmwareAnalyzerFollowups(targetArg: string): LaneCommand[] {
	return [
		{
			label: "firmware-extract-rerun",
			command: `[ -f /tmp/repi-firmware-extract.sh ] && /tmp/repi-firmware-extract.sh ${targetArg} || binwalk -eM ${targetArg} 2>/dev/null || file ${targetArg}`,
			evidence: "rerun firmware extraction/rootfs recovery with binwalk/unblob/unsquashfs fallbacks",
		},
		{
			label: "firmware-config-secret-rerun",
			command: `[ -f /tmp/repi-firmware-config.sh ] && /tmp/repi-firmware-config.sh || find /tmp/repi-firmware-extract -maxdepth 6 -type f | head -200`,
			evidence: "rerun rootfs config/secret/NVRAM/key/web artifact extraction",
		},
		{
			label: "firmware-service-surface-rerun",
			command: `[ -f /tmp/repi-firmware-services.sh ] && /tmp/repi-firmware-services.sh || grep -RasnE 'httpd|dropbear|telnetd|cgi-bin|nvram' /tmp/repi-firmware-extract 2>/dev/null | head -220`,
			evidence: "rerun init/service/web/CGI surface mapping from extracted rootfs",
		},
		{
			label: "firmware-emulation-scaffold-rerun",
			command: `[ -f /tmp/repi-firmware-emulation.sh ] && /tmp/repi-firmware-emulation.sh || printf '%s\n' 'extract rootfs before firmware emulation scaffold'`,
			evidence: "rerun QEMU/chroot emulation scaffold and service smoke-test plan",
		},
		{
			label: "firmware-report-scaffold",
			command:
				"python3 - <<'PY'\nprint('[firmware-report] inputs=image,extract,config,service,emulation anchors')\nprint('Next: normalize rootfs paths, credentials, endpoints, init services, emulation commands, and reproduction evidence into attack graph.')\nPY",
			evidence: "consolidated firmware/IoT rootfs, secret, service, and emulation report scaffold",
		},
	];
}

export function firmwareAnalyzerNextLane(buckets: {
	image: number;
	extract: number;
	config: number;
	service: number;
	emu: number;
}): string | undefined {
	if (buckets.emu > 0 || buckets.service > 0) return "emulate/report";
	if (buckets.config > 0) return "services/emulate";
	if (buckets.extract > 0) return "filesystem/services";
	if (buckets.image > 0) return "extract/filesystem";
	return undefined;
}

export function firmwareAnalyzerReverseNext(): string[] {
	return reverseDomainCaptureNextCommands({
		routeOrBlob: "firmware iot reverse binary extract",
		includeGates: true,
	}).slice(0, 3);
}
