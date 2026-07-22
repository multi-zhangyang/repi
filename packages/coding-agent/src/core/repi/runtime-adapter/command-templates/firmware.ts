/** Runtime adapter command templates: firmware. */

import { FIRMWARE_ARCHIVE_HOST_LINES } from "./firmware-archive-host.ts";
import { FIRMWARE_BINWALK_HOST_LINES } from "./firmware-binwalk-host.ts";
import { FIRMWARE_DEEP_SURROGATE_LINES } from "./firmware-deep-surrogates.ts";
import { FIRMWARE_DTB_SURROGATE_LINES } from "./firmware-dtb-surrogate.ts";
import { FIRMWARE_EXTRACT_HOST_LINES } from "./firmware-extract-host.ts";
import { FIRMWARE_IMAGE_SURROGATE_LINES } from "./firmware-image-surrogate.ts";

export function rootfsServiceMapCommandTemplate(mode: "native" | "fallback"): string {
	const prefix =
		mode === "native"
			? "adapter-firmware-rootfs-service-map-runner:"
			: "adapter-firmware-rootfs-service-map-runner-fallback:";
	const head = [
		"set +e",
		`printf "[adapter-firmware] adapter=${prefix} target=%s mode=${mode}\\n" "\${target:-$1}"`,
		'target="${target:-$1}"',
		`printf "[adapter-rootfs-target] target=%s mode=${mode}\\n" "$target"`,
		'file "$target" 2>/dev/null | sed "s/^/[firmware-file] /" || true',
		"CAP_EXTRACT=0; CAP_ACCOUNT=0; CAP_SERVICE=0; CAP_CONFIG=0; CAP_ELF=0; CAP_BINWALK=0; CAP_IMAGE=0",
		...FIRMWARE_BINWALK_HOST_LINES,
		...FIRMWARE_EXTRACT_HOST_LINES,
		...FIRMWARE_ARCHIVE_HOST_LINES,
		'if [ -f "$target" ] && command -v file >/dev/null 2>&1; then file -b "$target" 2>/dev/null | grep -qi ELF && CAP_ELF=1; fi',
		'if [ -f "$target" ]; then strings -a -n 6 "$target" 2>/dev/null | grep -iE "passwd|shadow|dropbear|busybox|httpd|telnet|root:|password|nvram" | head -60 | sed "s/^/[firmware-config] /"; fi',
		'if [ -f "$target" ]; then strings -a -n 8 "$target" 2>/dev/null | grep -iE "BEGIN (RSA |OPENSSH |EC )?PRIVATE|password=|admin:|root:" | head -40 | sed "s/^/[firmware-secret] /"; fi',
	];
	const mid = [
		'if [ -d "$target" ]; then',
		'  if [ -f "$target/etc/passwd" ]; then CAP_ACCOUNT=1; awk \'{print "[rootfs-account] path=/etc/passwd line=" $0}\' "$target/etc/passwd" | head -80; fi',
		'  if [ -f "$target/etc/shadow" ]; then CAP_ACCOUNT=1; printf "[rootfs-account] path=/etc/shadow present=true\\n"; fi',
		'  for dir in "$target/etc/init.d" "$target/etc/rc.d" "$target/lib/systemd/system"; do [ -d "$dir" ] || continue; while IFS= read -r f; do rel="${f#$target/}"; printf "[rootfs-service] path=%s name=%s\\n" "$rel" "$(basename "$f")"; CAP_SERVICE=1; done < <(find "$dir" -maxdepth 2 -type f 2>/dev/null | head -160); done',
		'  for dir in "$target/bin" "$target/sbin" "$target/usr/bin" "$target/usr/sbin"; do [ -d "$dir" ] || continue; find "$dir" -maxdepth 2 -type f 2>/dev/null | grep -E -i "/(busybox|httpd|dropbear|telnetd|uhttpd|init)$" | head -160 | while IFS= read -r f; do rel="${f#$target/}"; printf "[rootfs-binary] path=%s name=%s\\n" "$rel" "$(basename "$f")"; CAP_ELF=1; done; done',
		'  grep -R -I -n -E "httpd|dropbear|telnet|busybox|passwd|shadow|uci|init\\.d|password|token|key|credential|secret" "$target/etc" "$target/bin" "$target/sbin" 2>/dev/null | head -260 | sed "s/^/[rootfs-config-secret] /" || true',
		'  if ls "$target"/etc/init.d/* "$target"/etc/rc.d/* "$target"/lib/systemd/system/* >/dev/null 2>&1; then CAP_SERVICE=1; fi',
		'  if find "$target/bin" "$target/sbin" "$target/usr/bin" "$target/usr/sbin" -maxdepth 2 -type f 2>/dev/null | grep -Eiq "/(busybox|httpd|dropbear|telnetd|uhttpd|init)$"; then CAP_ELF=1; fi',
		"  CAP_CONFIG=1",
		"  CAP_EXTRACT=1",
		"fi",
		'if [ -f "$target" ]; then CAP_IMAGE=1; fi',
		'printf "[firmware-env] file=%s binwalk=%s strings=%s\\n" "$(command -v file || true)" "$(command -v binwalk || true)" "$(command -v strings || true)"',
		'printf "[firmware-proof-capture] domain=firmware extract=%s account=%s service=%s config=%s elf=%s binwalk=%s image=%s\\n" "$CAP_EXTRACT" "$CAP_ACCOUNT" "$CAP_SERVICE" "$CAP_CONFIG" "$CAP_ELF" "$CAP_BINWALK" "$CAP_IMAGE"',
		'if [ "$CAP_EXTRACT" = "1" ] && { [ "$CAP_ACCOUNT" = "1" ] || [ "$CAP_CONFIG" = "1" ] || [ "$CAP_BINWALK" = "1" ] || [ "$CAP_IMAGE" = "1" ]; }; then',
		'  printf "[firmware-proof-capture] proof.exit=runtime_capture_strong bind_ready=true note=host-tool-or-rootfs-map+deep+binwalk+extract\\n"',
		'elif [ "$CAP_EXTRACT" = "1" ] || [ "$CAP_BINWALK" = "1" ] || [ "$CAP_IMAGE" = "1" ]; then',
		'  printf "[firmware-proof-capture] proof.exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n"',
		"else",
		'  printf "[firmware-proof-capture] proof.exit=pending_runtime_capture bind_ready=false note=need-rootfs-or-image\\n"',
		"fi",
		'printf "[firmware-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run,re_lane_plan_extract\\n"',
		'printf "[runtime-technique] fw-rootfs-extract | fw-busybox-cred-dump | fw-service-surface-map\\n"',
	];
	return [
		...head,
		...FIRMWARE_IMAGE_SURROGATE_LINES,
		...FIRMWARE_DTB_SURROGATE_LINES,
		...FIRMWARE_DEEP_SURROGATE_LINES,
		...mid,
	]
		.filter(Boolean)
		.join("\n");
}
