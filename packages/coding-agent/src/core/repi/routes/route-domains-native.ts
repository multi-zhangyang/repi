/** Route domains: pwn/malware/firmware/native reverse. */
import type { RoutePlan } from "./patterns.ts";
import { plan } from "./patterns.ts";
import type { RouteSignals } from "./route-signals.ts";

export function routeRepiDomainNative(lower: string, s: RouteSignals): RoutePlan | undefined {
	if (
		/\bpwn\b|\brop\b|ret2libc|\bheap\b|tcache|fastbin|format[-_ ]?string|fmtstr|srop|sigreturn|ret2dlresolve|dlresolve|one_gadget|seccomp|seccomp[-_ ]?bpf|syscall filter|pwntools|栈|堆/.test(
			lower,
		)
	) {
		return plan(
			"Pwn / exploit",
			"turn primitive into reliable exploit",
			"checksec/gdb/pwntools/libc/gadgets",
			"pwn-chain",
			["mitigation map", "primitive proof", "leak source", "payload build", "remote stability"],
		);
	}
	if (/malware|恶意|样本|yara|sigma|ioc|c2|beacon|implant|loader|ransom|trojan|backdoor|反调试|反沙箱/.test(lower)) {
		return plan(
			"Malware analysis",
			"recover sample behavior, config, and IOCs",
			"file/strings/imports + yara/capa/floss + sandbox trace",
			"malware-analysis",
			["sample triage", "static IOC/config hints", "behavior trace", "config decode", "IOC report"],
		);
	}
	if (
		/firmware|固件|\biot\b|router|openwrt|squashfs|uboot|u-boot|uart|jtag|mips|\barm(?:el|hf|64)?\b|ubi\b|ubifs|trx\b|uimage|initramfs|rootfs/.test(
			lower,
		)
	) {
		return plan(
			"Firmware / IoT",
			"recover firmware filesystem, secrets, services, and emulation path",
			"binwalk/unblob/unsquashfs + config grep + qemu/chroot scaffold",
			"firmware-iot",
			["image inventory", "extract rootfs", "config/secret map", "service attack surface", "emulation/report"],
		);
	}
	// Native reverse: concrete binary keywords win; bare 逆向 alone only without web-target.
	if (s.nativeRouteSignal) {
		return plan(
			"Native reverse",
			"understand compiled/native target",
			"file/checksec/strings/imports + r2/Ghidra/trace",
			"reverse-engineering",
			[
				"headers/imports",
				"strings and xrefs",
				"entry/control flow",
				"dynamic trace",
				"re_native_runtime run",
				"scripted decode",
			],
		);
	}
	return undefined;
}
