/** Specialist pack handlers: mobile. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsAndroidMobile(ctx: SpecialistPackContext): void {
	ctx.specialists.push("Android APK/mobile runtime");
	ctx.add(
		"android-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_mobile_runtime run ${ctx.targetArg}" "re_native_runtime run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[android-runtime-repi-bridge] target_missing\n'",
		"bridge Android APK/mobile runtime to reverse proof.exit gates",
	);
	if (!ctx.target) {
		ctx.add(
			"android-apk-ctx.target-discovery",
			"find . -maxdepth 5 -type f \\( -iname '*.apk' -o -iname '*.xapk' -o -iname '*.apks' -o -iname 'AndroidManifest.xml' -o -iname 'classes.dex' \\) 2>/dev/null | sort | head -120",
			"discover APK/DEX/manifest candidates before Android reverse commands",
		);
	}
	ctx.add(
		"android-apk-fingerprint",
		ctx.target
			? `file ${ctx.targetArg}; sha256sum ${ctx.targetArg}; (command -v aapt >/dev/null && aapt dump badging ${ctx.targetArg} | head -80) || unzip -l ${ctx.targetArg} | head -120`
			: "printf '[android-apk] target_missing\\n'",
		"APK format/hash/package/activity/sdk fingerprint",
	);
	ctx.add(
		"android-manifest-permissions-map",
		ctx.target
			? `(command -v aapt >/dev/null && aapt dump permissions ${ctx.targetArg}; aapt dump xmltree ${ctx.targetArg} AndroidManifest.xml 2>/dev/null | head -200) || unzip -p ${ctx.targetArg} AndroidManifest.xml 2>/dev/null | head -40 || true`
			: "printf '[android-manifest] target_missing\\n'",
		"manifest permissions/components and exported surface",
	);
	ctx.add(
		"android-jadx-keyword-map",
		ctx.target
			? `tmp=$(mktemp -d /tmp/repi-jadx-XXXX); (command -v jadx >/dev/null && jadx -q -d "$tmp" ${ctx.targetArg} >/dev/null 2>&1 && rg -n "license|serial|key|valid|invalid|check|verify|root|debug|frida|token|secret|signature|encrypt|decrypt|okhttp|Retrofit|SharedPreferences|WebView" "$tmp" | head -260) || unzip -l ${ctx.targetArg} | head -160; echo "jadx_out=$tmp"`
			: "printf '[android-jadx] target_missing\\n'",
		"Java/Kotlin keyword call sites for auth/crypto/root/network sinks",
	);
	ctx.add(
		"android-native-lib-map",
		ctx.target
			? `unzip -l ${ctx.targetArg} 2>/dev/null | awk '/\\.so$/ {print $4}' | head -100; so=$(unzip -l ${ctx.targetArg} 2>/dev/null | awk '/lib\\/.*\\.so$/ {print $4; exit}'); if [ -n "$so" ]; then unzip -p ${ctx.targetArg} "$so" > /tmp/repi-apk-lib.so 2>/dev/null && file /tmp/repi-apk-lib.so && (command -v readelf >/dev/null && readelf -dW /tmp/repi-apk-lib.so | head -60) || true; fi`
			: "printf '[android-native] target_missing\\n'",
		"native .so inventory and first-lib dynamic section fingerprint",
	);
	ctx.add(
		"android-frida-hook-scaffold",
		`cat > /tmp/repi-android-frida-hooks.js <<'JS'\nfunction dump(label, value) { try { console.log(label, value); } catch (e) { console.log(label, String(e)); } }\nJava.perform(function () {\n  console.log('[android-frida] Java runtime ready');\n  try {\n    var Log = Java.use('android.util.Log');\n    Log.d.overload('java.lang.String','java.lang.String').implementation = function (t, m) { dump('[android-log]', t + ': ' + m); return this.d(t, m); };\n  } catch (e) {}\n  try {\n    var StringCls = Java.use('java.lang.String');\n    // common crypto / auth sinks\n    var MessageDigest = Java.use('java.security.MessageDigest');\n    MessageDigest.digest.overload('[B').implementation = function (b) {\n      var res = this.digest(b);\n      dump('[android-digest]', Java.use('android.util.Base64').encodeToString(res, 2));\n      return res;\n    };\n  } catch (e) {}\n  try {\n    var Cipher = Java.use('javax.crypto.Cipher');\n    Cipher.doFinal.overload('[B').implementation = function (b) {\n      dump('[android-cipher-in]', b.length);\n      var out = this.doFinal(b);\n      dump('[android-cipher-out]', out.length);\n      return out;\n    };\n  } catch (e) {}\n  try {\n    var OkHttp = Java.use('okhttp3.Request$Builder');\n    OkHttp.build.implementation = function () {\n      var req = this.build();\n      dump('[android-okhttp]', String(req.url()));\n      return req;\n    };\n  } catch (e) {}\n});\nJS\nprintf '[android-frida-hook] wrote=/tmp/repi-android-frida-hooks.js\\n'; adb devices; frida-ps -Uai 2>/dev/null | head -120 || true`,
		"Frida Java hook template for log/crypto/OkHttp and device process map",
	);
	ctx.add(
		"android-ssl-pinning-bypass-seed",
		`cat > /tmp/repi-android-ssl-pin.js <<'JS'\nJava.perform(function () {\n  try {\n    var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');\n    TrustManagerImpl.verifyChain.implementation = function () { console.log('[android-cert-pinning] verifyChain bypass'); return arguments[0]; };\n  } catch (e) { console.log('[android-cert-pinning] TrustManagerImpl missing', e); }\n  try {\n    var CertificatePinner = Java.use('okhttp3.CertificatePinner');\n    CertificatePinner.check.overload('java.lang.String','java.util.List').implementation = function (h, p) { console.log('[android-cert-pinning] okhttp bypass host=' + h); };\n  } catch (e) {}\n});\nJS\nprintf '[android-ssl-pin] wrote=/tmp/repi-android-ssl-pin.js\\n'`,
		"SSL pinning bypass seed for Conscrypt/OkHttp certificate checks",
	);
}
