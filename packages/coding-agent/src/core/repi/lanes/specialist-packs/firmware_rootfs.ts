/** Specialist pack handlers: firmware/DFIR. */

import { applyFirmwareRootfsDeepScaffolds } from "./firmware_rootfs_scaffolds.ts";
import type { SpecialistPackContext } from "./types.ts";
// Landmark: firmware-filesystem-config-secret-scaffold | firmware-service-surface-scaffold | firmware-emulation-scaffold (body in firmware_rootfs_scaffolds.ts)

export function applyWantsFirmware(ctx: SpecialistPackContext): void {
	ctx.specialists.push("Firmware/IoT rootfs");
	ctx.add(
		"firmware-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[firmware-runtime-repi-bridge] target_missing\n'",
		"bridge firmware/rootfs work to runtime adapter capture and proof.exit gates",
	);
	ctx.add(
		"firmware-image-discovery",
		"find . -maxdepth 6 -type f \\( -iname '*.bin' -o -iname '*.img' -o -iname '*.trx' -o -iname '*.chk' -o -iname '*.ubi' -o -iname '*.ubifs' -o -iname '*.squashfs' -o -iname '*.sqsh' -o -iname '*firmware*' -o -iname '*rootfs*' \\) -exec sh -c 'printf \"[firmware-candidate] path=%s \" \"$1\"; file \"$1\"' _ {} \\; | head -180",
		"candidate firmware/rootfs images from workspace",
	);
	ctx.add(
		"firmware-static-fingerprint-scaffold",
		`python3 - <<'PY'
	import hashlib, math, pathlib
	p = pathlib.Path(${ctx.targetPython})
	if not p.exists():
	    print('[firmware-image]', 'target_missing=' + str(p))
	else:
	    data = p.read_bytes()
	    counts = [0] * 256
	    for b in data[:4_000_000]: counts[b] += 1
	    total = sum(counts) or 1
	    entropy = -sum((c/total) * math.log2(c/total) for c in counts if c)
	    print('[firmware-image]', 'path=' + str(p), 'bytes=' + str(len(data)), 'sha256=' + hashlib.sha256(data).hexdigest(), 'magic=' + data[:16].hex(), 'entropy=' + f'{entropy:.3f}')
	PY
	file ${ctx.targetArg} 2>/dev/null || true
	sha256sum ${ctx.targetArg} 2>/dev/null || true
	binwalk ${ctx.targetArg} 2>/dev/null | head -180 || true
	strings -a -n 5 ${ctx.targetArg} 2>/dev/null | grep -Ei 'squashfs|ubifs|u-boot|uboot|openwrt|busybox|dropbear|telnetd|httpd|uhttpd|boa|lighttpd|cgi-bin|nvram|passwd|shadow|root:|admin|password|wps|upnp|trx|uImage|kernel|rootfs|mips|arm' | head -260`,
		"firmware image hash/magic/entropy/binwalk/rootfs/service hints",
	);
	ctx.add(
		"firmware-extract-rootfs-scaffold",
		`cat > /tmp/repi-firmware-extract.sh <<'SH'
	set +e
	TARGET="\${1:-<TARGET>}"
	OUT="\${REPI_FIRMWARE_OUT:-/tmp/repi-firmware-extract}"
	rm -rf "$OUT"; mkdir -p "$OUT/binwalk" "$OUT/unblob" "$OUT/manual"
	[ -f "$TARGET" ] || { printf '[firmware-extract] target_missing=%s\\n' "$TARGET"; exit 0; }
	printf '[firmware-extract] ctx.target=%s out=%s\\n' "$TARGET" "$OUT"
	command -v binwalk >/dev/null 2>&1 && binwalk -eM -C "$OUT/binwalk" "$TARGET" 2>&1 | head -220 | sed 's/^/[firmware-extract] binwalk /'
	command -v unblob >/dev/null 2>&1 && unblob "$TARGET" "$OUT/unblob" 2>&1 | head -220 | sed 's/^/[firmware-extract] unblob /'
	command -v unsquashfs >/dev/null 2>&1 && unsquashfs -f -d "$OUT/unsquashfs-root" "$TARGET" 2>&1 | head -120 | sed 's/^/[firmware-extract] unsquashfs /'
	command -v ubireader_extract_files >/dev/null 2>&1 && ubireader_extract_files -o "$OUT/ubi" "$TARGET" 2>&1 | head -120 | sed 's/^/[firmware-extract] ubi /'
	find "$OUT" -maxdepth 5 -type d \\( -iname '*squashfs-root*' -o -iname 'rootfs' -o -iname 'www' -o -iname 'etc' \\) -print 2>/dev/null | sed 's/^/[firmware-rootfs] /' | head -120
	find "$OUT" -maxdepth 5 -type f 2>/dev/null | head -160 | sed 's/^/[firmware-extract-file] /'
	SH
	chmod +x /tmp/repi-firmware-extract.sh
	/tmp/repi-firmware-extract.sh ${ctx.targetArg}`,
		"extract firmware rootfs/kernel/web/config artifacts with binwalk/unblob/unsquashfs/UBI fallbacks",
	);
	ctx.add(
		"firmware-rootfs-service-secret-map",
		`ROOT=$(find /tmp/repi-firmware-extract -type d \\( -name squashfs-root -o -name unsquashfs-root -o -name rootfs -o -path '*/filesystem*' \\) 2>/dev/null | head -1); ROOT=\${ROOT:-/tmp/repi-firmware-extract}; printf '[firmware-root] %s\\n' "$ROOT"; find "$ROOT" -maxdepth 5 -type f \\( -name 'passwd' -o -name 'shadow' -o -name '*config*' -o -name '*.conf' -o -name 'lighttpd*' -o -name 'uhttpd*' -o -name 'dropbear*' -o -name 'authorized_keys' -o -name 'id_rsa*' -o -name '*.pem' -o -name 'nvram*' \\) 2>/dev/null | head -160 | sed 's/^/[firmware-config] /'; rg -n "password|passwd|admin|root|telnet|dropbear|uhttpd|cgi-bin|private_key|BEGIN " "$ROOT" 2>/dev/null | head -200 | sed 's/^/[firmware-secret] /' || true`,
		"rootfs service/config/secret map from extracted firmware filesystem",
	);
	ctx.add(
		"firmware-elf-candidate-checksec",
		`ROOT=$(find /tmp/repi-firmware-extract -type d \\( -name squashfs-root -o -name unsquashfs-root -o -name rootfs \\) 2>/dev/null | head -1); ROOT=\${ROOT:-/tmp/repi-firmware-extract}; find "$ROOT" -type f -perm -111 2>/dev/null | head -40 | while read f; do file "$f" | grep -q ELF || continue; echo "[firmware-elf] $f"; (command -v checksec >/dev/null && checksec --file="$f" 2>/dev/null) || readelf -hW "$f" 2>/dev/null | head -20; done`,
		"ELF candidates inside extracted rootfs with mitigation fingerprint",
	);
	applyFirmwareRootfsDeepScaffolds(ctx);
}
