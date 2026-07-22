/** Filesystem/magic target signals for runtime adapter inspect. */

import { hasMagic, hasRootfsMarkers, magicLabel, readFileHead, readFileTail } from "./target-inspect-helpers.ts";
import type { RuntimeAdapterTargetKind, RuntimeAdapterTargetSignalV1 } from "./types.ts";

type TargetSignalAdd = (
	adapterId: string,
	targetKind: RuntimeAdapterTargetKind,
	reason: string,
	evidenceRank: RuntimeAdapterTargetSignalV1["evidenceRank"],
) => void;

export function appendFilesystemTargetSignals(
	text: string,
	targetKind: "file" | "directory" | undefined,
	add: TargetSignalAdd,
): string | undefined {
	let magic: string | undefined;
	if (targetKind === "directory") {
		try {
			if (hasRootfsMarkers(text))
				add(
					"firmware-rootfs-service-map-adapter",
					"firmware-rootfs",
					"rootfs markers on directory",
					"process_config",
				);
		} catch {
			// Directory probes are advisory only.
		}
		return magic;
	}
	if (targetKind !== "file") return magic;
	try {
		const head = readFileHead(text);
		const ascii = head.toString("latin1");
		const zipDirectoryText = hasMagic(head, [0x50, 0x4b, 0x03, 0x04]) ? readFileTail(text).toString("latin1") : "";
		const archiveSurface = `${ascii}\n${zipDirectoryText}`;
		magic = magicLabel(head, ascii);
		if (
			hasMagic(head, [0x7f, 0x45, 0x4c, 0x46]) ||
			hasMagic(head, [0x4d, 0x5a]) ||
			hasMagic(head, [0x00, 0x61, 0x73, 0x6d]) ||
			hasMagic(head, [0xcf, 0xfa, 0xed, 0xfe]) ||
			hasMagic(head, [0xce, 0xfa, 0xed, 0xfe]) ||
			hasMagic(head, [0xfe, 0xed, 0xfa, 0xcf]) ||
			hasMagic(head, [0xfe, 0xed, 0xfa, 0xce]) ||
			hasMagic(head, [0xca, 0xfe, 0xba, 0xbe])
		) {
			add("gdb-native-trace-adapter", "native-binary", `file magic=${magic ?? "native"}`, "runtime_artifact");
			add("r2-native-xref-adapter", "native-binary", `file magic=${magic ?? "native"}`, "runtime_artifact");
		}
		if (
			hasMagic(head, [0xd4, 0xc3, 0xb2, 0xa1]) ||
			hasMagic(head, [0xa1, 0xb2, 0xc3, 0xd4]) ||
			hasMagic(head, [0x4d, 0x3c, 0xb2, 0xa1]) ||
			hasMagic(head, [0xa1, 0xb2, 0x3c, 0x4d]) ||
			hasMagic(head, [0x0a, 0x0d, 0x0d, 0x0a])
		) {
			add("tshark-pcap-flow-adapter", "pcap-flow", `file magic=${magic ?? "pcap"}`, "network");
		}
		if (/^\s*[{[]/.test(ascii) && /"log"\s*:|"entries"\s*:|"request"\s*:|"response"\s*:/i.test(ascii)) {
			add("web-cdp-network-adapter", "web-url", `file magic=${magic ?? "har-json"}`, "network");
		}
		if (/hsqs|sqsh|UBI#|uImage|OpenWrt|BusyBox|u-boot|CFE/i.test(ascii))
			add(
				"binwalk-firmware-extract-adapter",
				"firmware-image",
				`file magic=${magic ?? "firmware-signature"}`,
				"runtime_artifact",
			);
		if (hasMagic(head, [0x64, 0x65, 0x78, 0x0a]))
			add("frida-mobile-hook-adapter", "mobile-package", "android dex magic", "runtime_artifact");
		if (
			hasMagic(head, [0x50, 0x4b, 0x03, 0x04]) &&
			(/\.(?:apk|ipa)$/i.test(text) ||
				/AndroidManifest\.xml|classes.*\.dex|Payload\/|Info\.plist/i.test(archiveSurface))
		) {
			add(
				"frida-mobile-hook-adapter",
				"mobile-package",
				`zip mobile manifest magic=${magic ?? "zip"}`,
				"runtime_artifact",
			);
		}
	} catch {
		// Best-effort file magic only; lexical detection above remains authoritative.
	}
	return magic;
}
