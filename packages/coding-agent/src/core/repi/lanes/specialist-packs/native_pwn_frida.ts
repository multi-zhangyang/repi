/** Specialist pack handlers: native/pwn. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsFridaTrace(ctx: SpecialistPackContext): void {
	ctx.add(
		"frida-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_native_runtime run ${ctx.targetArg}" "REPI_NATIVE_RUN=1 re_native_runtime run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[frida-runtime-bridge] target_missing\n'",
		"bridge frida host CAP path to reverse runtime capture and proof.exit gates",
	);
	ctx.specialists.push("Frida/GDB trace");
	if (/mobile|android|apk|frida|jadx|apktool|adb|smali/.test(ctx.context)) {
		ctx.add(
			"frida-gdb-trace-mobile-environment",
			"adb devices; adb shell getprop ro.product.cpu.abi 2>/dev/null || true; frida-ps -Uai 2>/dev/null | head -160 || true",
			"Android device, ABI, and process/package runtime map",
		);
		ctx.add(
			"frida-gdb-trace-hook-template",
			`cat > /tmp/repi-frida-trace.js <<'JS'\nfunction dumpBytes(label, value) {\n  try { console.log(label, hexdump(value, { length: Math.min(64, value.byteLength || 64) })); } catch (e) { console.log(label, String(value)); }\n}\nJava.perform(function() {\n  console.log('[repi-frida] Java runtime ready');\n  for (const klass of ['javax.crypto.Mac', 'java.security.MessageDigest', 'javax.crypto.Cipher']) {\n    try {\n      const K = Java.use(klass);\n      if (K.doFinal) K.doFinal.overloads.forEach(o => { o.implementation = function() { console.log('[doFinal]', klass, arguments.length); const ret = o.apply(this, arguments); dumpBytes('[doFinal.ret]', ret); return ret; }; });\n      if (K.digest) K.digest.overloads.forEach(o => { o.implementation = function() { console.log('[digest]', klass, arguments.length); const ret = o.apply(this, arguments); dumpBytes('[digest.ret]', ret); return ret; }; });\n    } catch (e) {}\n  }\n});\nfor (const name of ['strcmp','strncmp','memcmp','SSL_write','SSL_read']) {\n  const p = Module.findExportByName(null, name);\n  if (p) Interceptor.attach(p, { onEnter(args) { console.log('[native]', name, args[0], args[1]); } });\n}\nJS\ncat /tmp/repi-frida-trace.js`,
			"Frida Java crypto/network and native comparison hook template",
		);
	}
	if (ctx.target) {
		ctx.add(
			"frida-gdb-trace-gdb-scaffold",
			`cat > /tmp/repi-gdb-trace.gdb <<'GDB'\nset pagination off\nset disassembly-flavor intel\nset follow-fork-mode child\nbreak strcmp\nbreak strncmp\nbreak memcmp\nbreak strstr\nrun\nbt\ninfo registers\nx/24gx $rsp\nquit\nGDB\nprintf 'run: gdb -q %s -x /tmp/repi-gdb-trace.gdb\\n' ${ctx.targetArg}`,
			"GDB comparison breakpoint trace scaffold for native/runtime proof",
		);
	}
}
