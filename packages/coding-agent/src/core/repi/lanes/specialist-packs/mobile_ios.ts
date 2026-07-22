/** Specialist pack handlers: mobile. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsIosMobile(ctx: SpecialistPackContext): void {
	ctx.specialists.push("iOS IPA/mobile runtime");
	ctx.add(
		"ios-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_mobile_runtime run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[ios-runtime-repi-bridge] target_missing\n'",
		"bridge iOS IPA/mobile runtime to reverse proof.exit gates",
	);
	if (!ctx.target) {
		ctx.add(
			"ios-ipa-ctx.target-discovery",
			"find . -maxdepth 6 -type f \\( -iname '*.ipa' -o -iname 'Info.plist' -o -iname '*.mobileprovision' \\) -o -type d -iname '*.app' 2>/dev/null | head -160 | sed 's/^/[ios-candidate] /'",
			"discover IPA/App bundle candidates before iOS reverse commands",
		);
	}
	ctx.add(
		"ios-ipa-inventory-scaffold",
		`cat > /tmp/repi-ios-inventory.sh <<'SH'\nset +e\nTARGET="$1"; OUT="/tmp/repi-ios-ipa"; rm -rf "$OUT"; mkdir -p "$OUT"\nprintf '[ios-ipa] ctx.target=%s out=%s\\n' "$TARGET" "$OUT"\n[ -e "$TARGET" ] || { printf '[ios-ipa] target_missing=%s\\n' "$TARGET"; exit 0; }\nfile "$TARGET" 2>/dev/null | sed 's/^/[ios-ipa] file=/'\nsha256sum "$TARGET" 2>/dev/null | awk '{print "[ios-ipa] sha256="$1" path="$2}'\nif [ -f "$TARGET" ] && printf '%s' "$TARGET" | grep -Eiq '\\.ipa$'; then unzip -q "$TARGET" -d "$OUT" 2>/dev/null || true; fi\nAPP=$(find "$OUT" "$TARGET" -maxdepth 4 -type d -name '*.app' 2>/dev/null | head -1)\nprintf '[ios-ipa] app=%s\\n' "\${APP:-<none>}"\nINFO="$APP/Info.plist"\nif [ -f "$INFO" ]; then\n  plutil -p "$INFO" 2>/dev/null | sed 's/^/[ios-plist] /' | head -160 || python3 - <<'PY' "$INFO"\nimport plistlib, sys\nobj=plistlib.load(open(sys.argv[1], 'rb'))\nfor k in ['CFBundleIdentifier','CFBundleExecutable','CFBundleURLTypes','NSAppTransportSecurity','UIBackgroundModes']:\n    print('[ios-plist]', k, '=', obj.get(k))\nPY\nfi\nfind "$APP" -maxdepth 3 -type f \\( -name '*.dylib' -o -name '*.framework' -o -perm -111 \\) 2>/dev/null | head -160 | sed 's/^/[ios-binary] /'\nSH\nchmod +x /tmp/repi-ios-inventory.sh\n/tmp/repi-ios-inventory.sh ${ctx.targetArg}`,
		"IPA/App inventory: zip extraction, Info.plist, bundle id, executable/framework map",
	);
	ctx.add(
		"ios-macho-class-map-scaffold",
		`cat > /tmp/repi-ios-macho.sh <<'SH'\nset +e\nROOT="/tmp/repi-ios-ipa"\nAPP=$(find "$ROOT" "$1" -maxdepth 5 -type d -name '*.app' 2>/dev/null | head -1)\nBIN=""\nif [ -n "$APP" ] && [ -f "$APP/Info.plist" ]; then\n  EXE=$(python3 - <<'PY' "$APP/Info.plist" 2>/dev/null\nimport plistlib, sys\nprint(plistlib.load(open(sys.argv[1], 'rb')).get('CFBundleExecutable',''))\nPY\n); [ -n "$EXE" ] && BIN="$APP/$EXE"\nfi\n[ -n "$BIN" ] || BIN=$(find "$APP" "$1" -maxdepth 3 -type f -perm -111 2>/dev/null | head -1)\nprintf '[ios-macho] app=%s bin=%s\\n' "\${APP:-<none>}" "\${BIN:-<none>}"\n[ -f "$BIN" ] || exit 0\nfile "$BIN" | sed 's/^/[ios-macho] file=/'\notool -L "$BIN" 2>/dev/null | sed 's/^/[ios-otool] /' | head -120 || true\nnm -m "$BIN" 2>/dev/null | grep -Ei 'SecItem|Keychain|NSURLSession|CryptoKit|CommonCrypto|CCCrypt|jail|debug|ptrace|signature|sign|encrypt|decrypt|token|password' | head -220 | sed 's/^/[ios-symbol] /' || true\nclass-dump "$BIN" 2>/dev/null | grep -Ei '@interface|SecItem|Keychain|NSURLSession|Crypto|Jail|Debug|Login|Auth|Token|Sign' | head -220 | sed 's/^/[ios-class] /' || true\nstrings -a -n 5 "$BIN" | grep -Ei 'https?://|api/|graphql|token|secret|password|signature|nonce|timestamp|keychain|jailbreak|frida|ptrace|SSL|pinning|SecTrust|CCCrypt|CryptoKit' | head -260 | sed 's/^/[ios-string] /'\nSH\nchmod +x /tmp/repi-ios-macho.sh\n/tmp/repi-ios-macho.sh ${ctx.targetArg}`,
		"Mach-O/class/selector/string map for iOS auth, crypto, keychain, URLSession, jailbreak and TLS pinning sinks",
	);
	ctx.add(
		"ios-frida-objection-hook-scaffold",
		`cat > /tmp/repi-ios-frida-hooks.js <<'JS'\nif (ObjC.available) {\n  console.log('[ios-frida] ObjC runtime ready');\n  const hookObjC = (cls, sel) => {\n    try {\n      const impl = ObjC.classes[cls][sel].implementation;\n      Interceptor.attach(impl, { onEnter(args) { console.log('[ios-hook]', cls, sel, 'self=' + args[0]); } });\n    } catch (e) {}\n  };\n  ['NSURLSession','NSMutableURLRequest','SecItem','LAContext','NSData','NSString'].forEach(c => console.log('[ios-class-check]', c, !!ObjC.classes[c]));\n  hookObjC('NSMutableURLRequest', '- setValue:forHTTPHeaderField:');\n  hookObjC('NSMutableURLRequest', '- setHTTPBody:');\n  hookObjC('LAContext', '- evaluatePolicy:localizedReason:reply:');\n}\nfor (const name of ['SecItemCopyMatching','SecItemAdd','SecItemUpdate','CCCrypt','SecTrustEvaluate','SecTrustEvaluateWithError','ptrace']) {\n  const p = Module.findExportByName(null, name);\n  if (p) Interceptor.attach(p, { onEnter(args) { console.log('[ios-native-hook]', name, args[0], args[1], args[2]); } });\n}\nJS\nprintf '[ios-frida-hook-template] /tmp/repi-ios-frida-hooks.js hooks=NSURLSession,NSMutableURLRequest,SecItem,CCCrypt,SecTrust,ptrace\\n'\nsed -n '1,260p' /tmp/repi-ios-frida-hooks.js\nfrida-ps -Uai 2>/dev/null | head -120 | sed 's/^/[ios-frida-process] /' || true\nobjection --help 2>/dev/null | head -20 | sed 's/^/[ios-objection] /' || true`,
		"iOS Frida/objection hook template for request signing, keychain, crypto, TLS trust and anti-debug sinks",
	);
	ctx.add(
		"ios-codesign-entitlements",
		ctx.target
			? `(command -v codesign >/dev/null && codesign -d --entitlements :- ${ctx.targetArg} 2>/dev/null | sed 's/^/[ios-entitlements] /' | head -160) || (command -v plutil >/dev/null && find /tmp/repi-ios-ipa ${ctx.targetArg} -name Info.plist 2>/dev/null | head -5 | while read p; do echo "[ios-plist] $p"; plutil -p "$p" 2>/dev/null | head -80; done) || strings -a -n 6 ${ctx.targetArg} | grep -Ei 'get-task-allow|keychain|aps-environment|com.apple.security' | head -80`
			: "printf '[ios-entitlements] target_missing\\n'",
		"codesign entitlements / Info.plist security capability map",
	);
	ctx.add(
		"ios-network-replay-scaffold",
		`python3 - <<'PY'\nimport pathlib, re\nroots=[pathlib.Path('/tmp/repi-ios-ipa'), pathlib.Path(${ctx.targetPython})]\nseen=set()\nfor root in roots:\n    if not root.exists(): continue\n    files=[root] if root.is_file() else [p for p in root.rglob('*') if p.is_file()]\n    for p in files[:400]:\n        try: data=p.read_bytes()[:2_000_000]\n        except Exception: continue\n        text=data.decode('utf-8','ignore')\n        for url in re.findall(r'https?://[^\\s"\\'<>]+', text):\n            if url not in seen:\n                seen.add(url); print('[ios-network-replay]', 'url=' + url[:240], 'source=' + str(p))\n        if re.search(r'signature|nonce|timestamp|token|Authorization|SecTrust|pinning|CCCrypt|CryptoKit', text, re.I):\n            print('[ios-network-anchor]', 'source=' + str(p), 'keywords=signature/nonce/token/pinning/crypto')\nprint('[ios-network-replay]', 'next=set captured headers/body from ios-frida hooks and replay with curl/node verifier')\nPY`,
		"iOS network/signing/TLS-pinning replay seed from IPA strings and runtime hook anchors",
	);
}
