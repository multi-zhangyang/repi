/** Technique catalog slice: firmware_iot late. */
import type { TechniqueEntry } from "./types.ts";

export const FIRMWARE_IOT_TECHNIQUES_LATE: readonly TechniqueEntry[] = [
	{
		id: "fw-secure-boot-bypass",
		name: "Secure-boot / signed-image bypass",
		domain: "firmware-iot",
		mitre: ["T1068", "T1211"],
		cwe: ["CWE-693", "CWE-347"],
		triggers:
			"Device enforces signed firmware/boot; need to run a modified image. Bypass classes: key leak, weak sig verify, downgrade, fault injection.",
		procedure: [
			"Recover the verification key: extract from bootloader ROM dump, or a leaked vendor key (check rootfs/bootloader strings).",
			"Audit the verify routine: does it check the cert chain, or just `memcmp` a hash? Does it fail-open on error? Bypass via fault injection (voltage/clock glitch) on the branch.",
			"Downgrade: flash an old signed image with a known vuln if version rollback isn't enforced.",
			"Replace pubkey: if you can write the pubkey store (e.g. via U-Boot/JTAG), install your own key and sign your image.",
			"Sign with the recovered key: rebuild the image, recompute the signature/hash the loader expects.",
		],
		proofExit:
			"Modified unsigned/self-signed image boots and runs on the device (your code executes at boot), captured via serial/log.",
		pitfalls: [
			"Secure boot with a fuse-locked key in OTP is not bypassable by key replacement — need a verify-logic flaw or glitch.",
			"Rollback counters (eFuse anti-rollback) block downgrade even with a valid old signature.",
		],
		tools: ["python3", "binwalk", "gdb", "bash"],
	},
	{
		id: "fw-emulation-qemu",
		name: "Firmware runtime emulation (QEMU + libdt/ARMulator)",
		domain: "firmware-iot",
		mitre: ["T1613", "T1211"],
		cwe: ["CWE-693"],
		triggers:
			"Need to run/scale a firmware image without the physical device for dynamic analysis; image is a full rootfs + kernel or a single statically-linked binary.",
		procedure: [
			"Identify arch/endian: `binwalk -A` / `readelf -h`; pick the matching QEMU system/user.",
			"User-mode: `qemu-<arch> -L <rootfs> ./bin` for statically-linked or chroot-style runs.",
			"System-mode: `qemu-system-<arm>` with `-M <machine> -kernel <zImage> -dtb <dtb> -append 'root=/dev/... console=ttyAMA0' -nographic`.",
			"Fix NVRAM/env emulation with `firmadyne`/`fat`/`ARM-X` so the binary finds its expected env; patch hardcoded paths/devices via `qemu` `-device` or LD_PRELOAD stubs.",
			"Once up, run the same dynamic analysis (web fuzz, binary traces) you'd run on the device.",
		],
		proofExit:
			"Firmware services come up under emulation (web server responds, shell reachable) and you reproduce a behavior also seen on real hardware.",
		pitfalls: [
			"Most IoT firmware needs NVRAM/vendor daemons that aren't in the rootfs — without env emulation it kernel-panics or loops.",
			"Behavior under emulation can diverge from real hardware (timing, peripherals) — corroborate findings on the device.",
		],
		tools: ["qemu-user", "qemu-system", "python3", "binwalk", "gdb"],
	},
	{
		id: "fw-busybox-cred-dump",
		name: "Firmware rootfs credential and service dump",
		domain: "firmware-iot",
		mitre: ["T1552", "T1083"],
		cwe: ["CWE-798", "CWE-259"],
		triggers: "Extracted rootfs/squashfs/jffs2 from firmware; need default creds and listening services.",
		procedure: [
			"Extract: `binwalk -eM fw.bin` or `sasquatch`/`jefferson` as needed; locate rootfs.",
			"Harvest: /etc/passwd, shadow, hard-coded conf under /etc, /opt, www; `grep -RniE 'password|passwd|pwd|secret|apikey'`.",
			"Map startup: inittab, systemd, rcS, procd; list busybox applets and network daemons.",
			"Checksec/ELF scan on network-facing binaries; note version strings for known CVEs.",
			"Emulate only when offline analysis stalls — prefer static credential proof first.",
		],
		proofExit:
			"At least one concrete default credential or hard-coded secret with file path evidence, plus the service that consumes it.",
		pitfalls: [
			"Encrypted rootfs — need key from bootloader/UART first.",
			"False positive strings in docs — show conf assignment context.",
		],
		tools: ["binwalk", "squashfs-tools", "grep", "file", "strings", "readelf"],
	},
];
