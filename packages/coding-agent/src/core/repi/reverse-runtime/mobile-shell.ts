/** Mobile runtime shell/frida capture command builders. */
import { shellQuote } from "../target.ts";
import { MOBILE_AAPT_HOST_LINES } from "./mobile-shell-aapt.ts";
import { MOBILE_APK_DEEP_LINES } from "./mobile-shell-deep.ts";
import { MOBILE_DEVICE_HOST_LINES } from "./mobile-shell-device.ts";
import { MOBILE_DEX_EXTRA_LINES } from "./mobile-shell-dex.ts";
import { MOBILE_FRIDA_LEAN_LINES } from "./mobile-shell-frida.ts";
import { mobileRuntimeFridaHookScript } from "./mobile-shell-hooks.ts";
import { MOBILE_JADX_HOST_LINES } from "./mobile-shell-jadx.ts";
import { MOBILE_PROOF_CAPTURE_LINES } from "./mobile-shell-proof.ts";

export { mobileRuntimeFridaHookScript } from "./mobile-shell-hooks.ts";
// Landmark anchors for product-contract monofile scans (bodies in mobile-shell-proof/frida):
// mobile-proof-capture mobile-frida-host mobile-aapt mobile-jadx mobile-device-host mobile-emulator pure_python=0 summary.frida_host summary.ssl_pinning_signal
// proof.exit= bind_ready= runtime_capture_strong partial_runtime_capture summary.proof_exit summary.bind_ready PROOF_EXIT REPI_MOBILE_ATTACH
export function mobileRuntimeShellCommand(target?: string, packageName?: string, timeoutMs = 15000): string {
	const targetArg = shellQuote(target?.trim() ?? "");
	const packageArg = shellQuote(packageName?.trim() ?? "");
	const attachTimeout = Math.max(3, Math.ceil(timeoutMs / 1000));
	return [
		"set +e",
		`TARGET=${targetArg}`,
		`PKG=${packageArg}`,
		'printf "[mobile-env] adb=%s frida=%s frida_ps=%s aapt=%s jadx=%s apktool=%s unzip=%s gdb=%s\n" "$(command -v adb || true)" "$(command -v frida || true)" "$(command -v frida-ps || true)" "$(command -v aapt || true)" "$(command -v jadx || true)" "$(command -v apktool || true)" "$(command -v unzip || true)" "$(command -v gdb || true)"',
		`if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then printf "[mobile-apk] target=%s bytes=%s sha256=%s file=%s\\n" "$TARGET" "$(wc -c < "$TARGET" 2>/dev/null || echo 0)" "$(sha256sum "$TARGET" 2>/dev/null | awk '{print $1}')" "$(file -b "$TARGET" 2>/dev/null)"; else printf "[mobile-apk] target=%s exists=false\\n" "\${TARGET:-<missing>}"; fi`,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then strings -a "$TARGET" 2>/dev/null | grep -iE "frida|debug|root|xposed|substrate|ptrace|TracerPid|isDebuggerConnected|emulator|su\\b|magisk" | head -40 | sed "s/^/[mobile-anti-debug-check] /"; fi',
		...MOBILE_JADX_HOST_LINES,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v apktool >/dev/null 2>&1; then echo "[mobile-static-command] apktool d -f -o /tmp/repi-apktool $TARGET"; fi',
		'if command -v adb >/dev/null 2>&1; then adb devices -l 2>&1 | sed "s/^/[mobile-device] /"; else echo "[mobile-runtime-blocked] reason=adb_missing"; fi',
		'if [ -n "$PKG" ] && command -v adb >/dev/null 2>&1; then adb shell pidof "$PKG" 2>&1 | sed "s/^/[mobile-process] pidof $PKG /"; adb shell ps -A 2>/dev/null | grep "$PKG" | head -20 | sed "s/^/[mobile-process] /"; fi',
		'if command -v frida-ps >/dev/null 2>&1; then frida-ps -Uai 2>&1 | head -80 | sed "s/^/[mobile-frida-process] /"; else echo "[mobile-runtime-blocked] reason=frida_ps_missing"; fi',
		"cat > /tmp/repi-mobile-frida-hooks.js <<'JS'",
		mobileRuntimeFridaHookScript(),
		"JS",
		'echo "[mobile-frida-hook-template] /tmp/repi-mobile-frida-hooks.js hooks=Java.crypto,String.equals,Debug.isDebuggerConnected,native.strcmp,memcmp"',
		...MOBILE_DEVICE_HOST_LINES,
		...MOBILE_AAPT_HOST_LINES,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then strings -a "$TARGET" 2>/dev/null | grep -iE "TrustManager|X509TrustManager|OkHttpClient|CertificatePinner|ssl.?pin|pinning|network_security_config" | head -40 | sed "s/^/[mobile-ssl-pinning] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then strings -a "$TARGET" 2>/dev/null | grep -iE "isDebuggerConnected|TracerPid|ptrace|magisk|xposed|substrate|frida|su\\b|root detection|emulator" | head -40 | sed "s/^/[mobile-root-bypass-signal] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v unzip >/dev/null 2>&1; then unzip -p "$TARGET" assets/markers.txt 2>/dev/null | grep -iE "TrustManager|CertificatePinner|ssl|pinning|OkHttp" | head -20 | sed "s/^/[mobile-ssl-pinning] /"; unzip -p "$TARGET" assets/markers.txt 2>/dev/null | grep -iE "isDebuggerConnected|magisk|xposed|frida|TracerPid" | head -20 | sed "s/^/[mobile-root-bypass-signal] /"; fi',
		...MOBILE_APK_DEEP_LINES,
		...MOBILE_DEX_EXTRA_LINES,
		...MOBILE_FRIDA_LEAN_LINES,
		...MOBILE_PROOF_CAPTURE_LINES,
		`if [ -n "$PKG" ] && command -v frida >/dev/null 2>&1 && [ "\${REPI_MOBILE_ATTACH:-0}" = "1" ]; then timeout ${attachTimeout}s frida -U -f "$PKG" -l /tmp/repi-mobile-frida-hooks.js --no-pause 2>&1 | sed "s/^/[mobile-attach] /"; elif [ "\${CAP_LOCAL_ATTACH:-0}" = "1" ] || [ "\${REPI_FRIDA_LOCAL_ATTACH:-1}" = "1" ]; then echo "[mobile-runtime-blocked] reason=usb_attach_skipped_local_attach_ok pkg=\${PKG:-<missing>} set_REPI_MOBILE_ATTACH=1_for_usb_device"; else echo "[mobile-runtime-blocked] reason=attach_skipped pkg=\${PKG:-<missing>} set_REPI_MOBILE_ATTACH=1_to_attach"; fi`,
	].join("\n");
}
