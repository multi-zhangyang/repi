/** Firmware rootfs deep scaffolds: config/secret, service surface, emulation. */
import type { SpecialistPackContext } from "./types.ts";

export function applyFirmwareRootfsDeepScaffolds(ctx: SpecialistPackContext): void {
	ctx.add(
		"firmware-filesystem-config-secret-scaffold",
		`cat > /tmp/repi-firmware-config.sh <<'SH'
set +e
ROOT="\${REPI_FIRMWARE_ROOT:-}"
[ -n "$ROOT" ] || ROOT=$(find /tmp/repi-firmware-extract -type d \\( -name squashfs-root -o -name unsquashfs-root -o -name rootfs -o -path '*/filesystem' \\) 2>/dev/null | head -1)
[ -n "$ROOT" ] || ROOT=/tmp/repi-firmware-extract
printf '[firmware-config] root=%s\\n' "$ROOT"
find "$ROOT" -maxdepth 4 -type f \\( -path '*/etc/passwd' -o -path '*/etc/shadow' -o -path '*/etc/config/*' -o -path '*/etc/default/*' -o -name '*.conf' -o -name '*.cfg' -o -name '*.ini' -o -name '*nvram*' \\) -print 2>/dev/null | sed 's/^/[firmware-config] file=/' | head -220
grep -RasnE 'root:|admin|password|passwd|secret|token|key=|psk|WPA|ssid|nvram|telnet|dropbear|httpd|uhttpd|boa|lighttpd' "$ROOT/etc" "$ROOT/www" 2>/dev/null | head -260 | sed 's/^/[firmware-secret] /'
find "$ROOT" -maxdepth 6 -type f \\( -name '*id_rsa*' -o -name '*.pem' -o -name '*.key' -o -name 'authorized_keys' -o -name 'shadow' \\) -print 2>/dev/null | sed 's/^/[firmware-secret] keyfile=/' | head -80
find "$ROOT/www" "$ROOT/var/www" -maxdepth 6 -type f 2>/dev/null | grep -Ei '\\.(cgi|php|asp|js|html|lua)$' | sed 's/^/[firmware-web] /' | head -180
SH
chmod +x /tmp/repi-firmware-config.sh
/tmp/repi-firmware-config.sh`,
		"rootfs config, credential, NVRAM, key, and web artifact extraction scaffold",
	);
	ctx.add(
		"firmware-service-surface-scaffold",
		`cat > /tmp/repi-firmware-services.sh <<'SH'
set +e
ROOT="\${REPI_FIRMWARE_ROOT:-}"
[ -n "$ROOT" ] || ROOT=$(find /tmp/repi-firmware-extract -type d \\( -name squashfs-root -o -name unsquashfs-root -o -name rootfs -o -path '*/filesystem' \\) 2>/dev/null | head -1)
[ -n "$ROOT" ] || ROOT=/tmp/repi-firmware-extract
printf '[firmware-service] root=%s\\n' "$ROOT"
find "$ROOT/etc/init.d" "$ROOT/etc/rc.d" "$ROOT/etc/systemd" -maxdepth 3 -type f 2>/dev/null | sed 's/^/[firmware-init] /' | head -180
grep -RasnE 'httpd|uhttpd|boa|lighttpd|nginx|dropbear|sshd|telnetd|inetd|dnsmasq|upnpd|miniupnpd|rpcd|cgi-bin|iptables|nvram' "$ROOT/etc" "$ROOT/bin" "$ROOT/sbin" "$ROOT/usr" "$ROOT/www" 2>/dev/null | head -300 | sed 's/^/[firmware-service] /'
find "$ROOT" -maxdepth 7 -type f \\( -path '*/cgi-bin/*' -o -iname '*.cgi' -o -iname '*.lua' -o -iname '*.php' \\) -print 2>/dev/null | sed 's/^/[firmware-surface] endpoint=/' | head -180
SH
chmod +x /tmp/repi-firmware-services.sh
/tmp/repi-firmware-services.sh`,
		"init/service/web/CGI attack-surface scaffold from extracted rootfs",
	);
	ctx.add(
		"firmware-emulation-scaffold",
		`cat > /tmp/repi-firmware-emulation.sh <<'SH'
set +e
ROOT="\${REPI_FIRMWARE_ROOT:-}"
[ -n "$ROOT" ] || ROOT=$(find /tmp/repi-firmware-extract -type d \\( -name squashfs-root -o -name unsquashfs-root -o -name rootfs -o -path '*/filesystem' \\) 2>/dev/null | head -1)
[ -n "$ROOT" ] || ROOT=/tmp/repi-firmware-extract
BUSY=$(find "$ROOT" -type f \\( -name busybox -o -path '*/bin/sh' -o -path '*/sbin/init' \\) 2>/dev/null | head -1)
ARCH=$(file "$BUSY" 2>/dev/null || true)
printf '[firmware-emulation] root=%s busybox=%s arch=%s\\n' "$ROOT" "$BUSY" "$ARCH"
case "$ARCH" in
  *MIPS*) QEMU=qemu-mips-static ;;
  *ARM*aarch64*|*ARM64*) QEMU=qemu-aarch64-static ;;
  *ARM*) QEMU=qemu-arm-static ;;
  *) QEMU=qemu-unknown ;;
esac
printf '[firmware-emulation] qemu=%s\\n' "$QEMU"
printf '[firmware-emulation] run=cp $(command -v %s 2>/dev/null) %s/usr/bin/; chroot %s /bin/sh\\n' "$QEMU" "$ROOT" "$ROOT"
printf '[firmware-emulation] service_smoke=REPI_FIRMWARE_ROOT=%s /tmp/repi-firmware-services.sh\\n' "$ROOT"
SH
chmod +x /tmp/repi-firmware-emulation.sh
/tmp/repi-firmware-emulation.sh`,
		"QEMU/chroot emulation scaffold with arch and service smoke-test anchors",
	);
}
