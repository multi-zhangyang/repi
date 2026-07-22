/** Technique catalog slice: firmware_iot early. */
import type { TechniqueEntry } from "./types.ts";

export const FIRMWARE_IOT_TECHNIQUES_EARLY: readonly TechniqueEntry[] = [
	{
		id: "fw-elf-service-checksec-map",
		name: "Firmware rootfs ELF service + mitigation map",
		domain: "firmware-iot",
		mitre: ["T1602", "T1082"],
		cwe: ["CWE-693", "CWE-522"],
		triggers:
			"Extracted firmware rootfs available; need service binaries, accounts, and checksec/import map for attack surface.",
		procedure: [
			"Locate rootfs dir from binwalk extract (`squashfs-root`, `_*.extracted`, `/etc`).",
			"Account DB: `/etc/passwd`/`shadow`/`htpasswd`; note UID0 and empty passwords.",
			"Service map: `find` init.d/systemd/busybox applets; strings on httpd/dropbear/telnetd for default creds.",
			"ELF candidates: executable files under bin/sbin/usr; `file` then `checksec`/`readelf -d`/`rabin2 -i` for each high-value daemon.",
			"Config secrets: `rg -n 'password|passwd|key|token|admin' etc/ www/`; harvest certs/keys.",
			"Bridge: `re_runtime_adapter run binwalk-firmware-extract-adapter <img>` then `re_domain_proof_exit show firmware-iot`.",
		],
		proofExit:
			"[firmware-extract]/[firmware-rootfs-dir]+[rootfs-account]/[rootfs-service] and at least one [native-checksec]/ELF mitigation line for a network service binary.",
		pitfalls: [
			"Emulating full firmware first is slow — static service/ELF map often yields the first vulns.",
			"Stripped big-endian MIPS binaries need correct qemu-user, not x86 tools alone.",
		],
		tools: ["binwalk", "unsquashfs", "file", "checksec", "readelf", "rabin2", "rg", "strings"],
	},
	{
		id: "fw-rootfs-extract",
		name: "Firmware rootfs extract + secret/config harvest",
		domain: "firmware-iot",
		mitre: ["T1602", "T1552.007"],
		cwe: ["CWE-732", "CWE-522"],
		triggers:
			"Firmware image obtainable (vendor download, UART dump, flash chip read); squashfs/cramfs/jffs2/ubi rootfs inside; need config, creds, keys.",
		procedure: [
			"Identify: `binwalk <image>` → entropy + signatures; `file` on extracted chunks; `strings -a | grep -iE 'pass|key|root|admin'`.",
			"Extract: `binwalk -eM <image>`; for encrypted/obfuscated sections, find the key in the bootloader stage or a per-model key.",
			"Mount rootfs: `unsquashfs rootfs.squashfs` or `mount -o loop`; inspect `/etc/shadow`, `/etc/config`, init scripts, web root.",
			"Harvest: hardcoded creds, private keys, API tokens, telnet/ssh banners, backdoor accounts; `firmwalker.sh <rootfs>`.",
			"Cross-check creds against the running device's telnet/ssh/web login to prove they work.",
		],
		proofExit:
			"Extracted credential/key authenticates against the live device (shell or privileged web login) OR a private key decrypts captured device traffic; captured.",
		pitfalls: [
			"Encrypted firmware sections need the vendor key from another stage (bootloader/OTP) — don't assume binwalk -e alone.",
			"Default creds in a config ≠ usable if the device forces a password change on first boot; prove against a live unit.",
		],
		tools: ["binwalk", "unsquashfs", "strings", "python3", "firmwalker"],
	},
	{
		id: "fw-uart-uboot",
		name: "UART + bootloader (U-Boot) shell to root",
		domain: "firmware-iot",
		mitre: ["T1068", "T1547.001"],
		cwe: ["CWE-732", "CWE-693"],
		triggers:
			"Physical access to device PCB with UART pads; U-Boot bootloader with no password on `stop`/`bootdelay`.",
		procedure: [
			"Find UART: multimeter continuity to GND, then the TX/RX pads (TX idles high ~3.3V); solder headers.",
			"Identify baud: try 115200/57600/38400/9600 with a USB-TTL adapter; `screen /dev/ttyUSB0 115200`.",
			"Interrupt boot: hold a key / send space during the bootdelay window to drop to the U-Boot prompt.",
			"If `bootdelay=0` and `stop` is locked: short the flash CS pin to force a boot error that drops to ROM/U-Boot recovery, or glitch reset.",
			"At U-Boot: `setenv bootargs 'init=/bin/sh'` / `bootd` into single-user root, or `printenv` to dump env + keys; persist via `setenv`/`saveenv` or write a rootfs backdoor.",
		],
		proofExit:
			"Interactive root shell on the device via UART with `id`/`cat /etc/shadow` captured; OR U-Boot env/keys dumped.",
		pitfalls: [
			"UART levels are 3.3V logic — a 5V adapter can damage the SoC; use a level shifter or 3.3V adapter.",
			"Some SoCs disable UART output in production builds; confirm with a scope that TX toggles at boot.",
			"`saveenv` writes to a specific env partition; wrong offset can brick — read the datasheet/partition map first.",
		],
		tools: ["gdb", "python3", "bash", "binwalk"],
	},
];
