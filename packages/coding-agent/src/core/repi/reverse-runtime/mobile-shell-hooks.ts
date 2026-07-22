/** Mobile Frida hook template script body. */
export function mobileRuntimeFridaHookScript(): string {
	return `'use strict';
function safe(v) { try { return String(v); } catch (_) { return '<err>'; } }
function hex(bytes, limit) {
  try {
    const n = Math.min(bytes.length, limit || 32);
    let out = [];
    for (let i = 0; i < n; i++) out.push(('0' + (bytes[i] & 0xff).toString(16)).slice(-2));
    return out.join('');
  } catch (_) { return '<hex-err>'; }
}
if (Java.available) {
  Java.perform(function () {
    console.log('[mobile-crypto-hook] Java.perform ready');
    try {
      const Debug = Java.use('android.os.Debug');
      Debug.isDebuggerConnected.implementation = function () {
        const ret = this.isDebuggerConnected();
        console.log('[mobile-anti-debug-hook] Debug.isDebuggerConnected ret=' + ret);
        return ret;
      };
    } catch (e) { console.log('[mobile-hook-miss] android.os.Debug ' + e); }
    try {
      const StringCls = Java.use('java.lang.String');
      StringCls.equals.implementation = function (other) {
        const ret = this.equals(other);
        console.log('[mobile-compare-hook] String.equals self=' + safe(this) + ' other=' + safe(other) + ' ret=' + ret);
        return ret;
      };
    } catch (e) { console.log('[mobile-hook-miss] java.lang.String.equals ' + e); }
    try {
      const Cipher = Java.use('javax.crypto.Cipher');
      Cipher.doFinal.overload('[B').implementation = function (input) {
        console.log('[mobile-crypto-hook] Cipher.doFinal in=' + hex(input, 48));
        const out = this.doFinal(input);
        console.log('[mobile-crypto-hook] Cipher.doFinal out=' + hex(out, 48));
        return out;
      };
    } catch (e) { console.log('[mobile-hook-miss] javax.crypto.Cipher.doFinal ' + e); }
    try {
      const MessageDigest = Java.use('java.security.MessageDigest');
      MessageDigest.digest.overload('[B').implementation = function (input) {
        console.log('[mobile-crypto-hook] MessageDigest.digest alg=' + this.getAlgorithm() + ' in=' + hex(input, 48));
        const out = this.digest(input);
        console.log('[mobile-crypto-hook] MessageDigest.digest out=' + hex(out, 48));
        return out;
      };
    } catch (e) { console.log('[mobile-hook-miss] MessageDigest.digest ' + e); }
    try {
      const Mac = Java.use('javax.crypto.Mac');
      Mac.doFinal.overload('[B').implementation = function (input) {
        console.log('[mobile-crypto-hook] Mac.doFinal alg=' + this.getAlgorithm() + ' in=' + hex(input, 48));
        const out = this.doFinal(input);
        console.log('[mobile-crypto-hook] Mac.doFinal out=' + hex(out, 48));
        return out;
      };
    } catch (e) { console.log('[mobile-hook-miss] Mac.doFinal ' + e); }
  });
} else {
  console.log('[mobile-runtime-blocked] reason=java_unavailable');
}
for (const name of ['strcmp', 'strncmp', 'memcmp', 'strstr']) {
  const ptr = Module.findExportByName(null, name);
  if (!ptr) continue;
  Interceptor.attach(ptr, {
    onEnter(args) {
      this.name = name;
      this.a0 = args[0];
      this.a1 = args[1];
      console.log('[mobile-native-hook] ' + name + ' a0=' + args[0] + ' a1=' + args[1]);
      try { console.log('[mobile-native-hook] ' + name + ' s0=' + args[0].readCString().slice(0, 160)); } catch (_) {}
      try { console.log('[mobile-native-hook] ' + name + ' s1=' + args[1].readCString().slice(0, 160)); } catch (_) {}
    },
    onLeave(retval) { console.log('[mobile-native-hook] ' + this.name + ' ret=' + retval); }
  });
}`;
}
