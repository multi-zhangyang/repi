/** Runtime adapter target inspection pure helpers. */
import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { join } from "node:path";
import type { RuntimeAdapterTargetKind, RuntimeAdapterTargetSignalV1 } from "./types.ts";

export function readFileHead(path: string, maxBytes = 4096): Buffer {
	const fd = openSync(path, "r");
	try {
		const buffer = Buffer.alloc(maxBytes);
		const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
		return buffer.subarray(0, bytesRead);
	} finally {
		closeSync(fd);
	}
}

export function readFileTail(path: string, maxBytes = 131072): Buffer {
	const stat = statSync(path);
	const fd = openSync(path, "r");
	try {
		const length = Math.min(maxBytes, stat.size);
		const offset = Math.max(0, stat.size - length);
		const buffer = Buffer.alloc(length);
		const bytesRead = readSync(fd, buffer, 0, buffer.length, offset);
		return buffer.subarray(0, bytesRead);
	} finally {
		closeSync(fd);
	}
}

export function hasMagic(buffer: Buffer, bytes: number[]): boolean {
	return bytes.every((byte, index) => buffer[index] === byte);
}

export function hasRootfsMarkers(path: string): boolean {
	const rootfsMarkers = [
		join(path, "etc", "passwd"),
		join(path, "etc", "shadow"),
		join(path, "etc", "init.d"),
		join(path, "etc", "config"),
		join(path, "etc", "os-release"),
		join(path, "bin", "busybox"),
		join(path, "sbin", "init"),
		join(path, "usr", "sbin", "httpd"),
	];
	return rootfsMarkers.some((marker: any) => existsSync(marker));
}

export function magicLabel(head: Buffer, ascii: string): string | undefined {
	if (hasMagic(head, [0x7f, 0x45, 0x4c, 0x46])) return "elf";
	if (hasMagic(head, [0x4d, 0x5a])) return "pe-mz";
	if (
		hasMagic(head, [0xcf, 0xfa, 0xed, 0xfe]) ||
		hasMagic(head, [0xce, 0xfa, 0xed, 0xfe]) ||
		hasMagic(head, [0xfe, 0xed, 0xfa, 0xcf]) ||
		hasMagic(head, [0xfe, 0xed, 0xfa, 0xce]) ||
		hasMagic(head, [0xca, 0xfe, 0xba, 0xbe])
	)
		return "mach-o";
	if (hasMagic(head, [0x00, 0x61, 0x73, 0x6d])) return "wasm";
	if (hasMagic(head, [0x64, 0x65, 0x78, 0x0a])) return "android-dex";
	if (hasMagic(head, [0x50, 0x4b, 0x03, 0x04])) return "zip";
	if (
		hasMagic(head, [0xd4, 0xc3, 0xb2, 0xa1]) ||
		hasMagic(head, [0xa1, 0xb2, 0xc3, 0xd4]) ||
		hasMagic(head, [0x4d, 0x3c, 0xb2, 0xa1]) ||
		hasMagic(head, [0xa1, 0xb2, 0x3c, 0x4d])
	)
		return "pcap";
	if (hasMagic(head, [0x0a, 0x0d, 0x0d, 0x0a])) return "pcapng";
	if (/hsqs|sqsh/i.test(ascii)) return "squashfs";
	if (/UBI#|uImage|OpenWrt|BusyBox|u-boot|CFE/i.test(ascii)) return "firmware-signature";
	if (/^\s*[{[]/.test(ascii) && /"log"\s*:|"entries"\s*:|"request"\s*:|"response"\s*:/i.test(ascii)) return "har-json";
	return undefined;
}

export function pushSignal(signals: RuntimeAdapterTargetSignalV1[], signal: RuntimeAdapterTargetSignalV1): void {
	if (signals.some((row: any) => row.adapterId === signal.adapterId && row.reason === signal.reason)) return;
	signals.push(signal);
}

export function uniqueTargetKinds(signals: RuntimeAdapterTargetSignalV1[]): RuntimeAdapterTargetKind[] {
	return Array.from(new Set(signals.map((signal: any) => signal.targetKind)));
}

export function uniqueAdapterIds(signals: RuntimeAdapterTargetSignalV1[]): string[] {
	return Array.from(new Set(signals.map((signal: any) => signal.adapterId)));
}
