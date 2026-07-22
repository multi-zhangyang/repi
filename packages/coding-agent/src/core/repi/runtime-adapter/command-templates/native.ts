const NATIVE_MITIGATION_MARKER = "[native-mitigation]";
/** Runtime adapter command templates: native. */

export function nativeMitigationShellSnippet(label = NATIVE_MITIGATION_MARKER.slice(1, -1)): string {
	return [
		"if command -v checksec >/dev/null 2>&1; then checksec --file=\"$target\" 2>/dev/null | sed 's/^/[native-checksec] /'; fi;",
		"if command -v rabin2 >/dev/null 2>&1; then rabin2 -I \"$target\" 2>/dev/null | sed 's/^/[native-rabin-info] /'; rabin2 -i \"$target\" 2>/dev/null | head -80 | sed 's/^/[native-rabin-imports] /'; elif command -v r2 >/dev/null 2>&1; then r2 -qq -c 'iI; ii; q' \"$target\" 2>/dev/null | sed 's/^/[native-r2] /'; fi;",
		"if command -v readelf >/dev/null 2>&1; then",
		'  elf_type="$(readelf -h "$target" 2>/dev/null | awk \'/Type:/ {print $2; exit}\')";',
		'  if [ -n "$elf_type" ]; then',
		'    pie=no; [ "$elf_type" = "DYN" ] && pie=yes;',
		"    if readelf -W -l \"$target\" 2>/dev/null | grep -q 'GNU_RELRO'; then relro=partial; else relro=none; fi;",
		"    if readelf -W -d \"$target\" 2>/dev/null | grep -q 'BIND_NOW'; then relro=full; fi;",
		'    stack_line="$(readelf -W -l "$target" 2>/dev/null | awk \'/GNU_STACK/ {print; exit}\')";',
		"    nx=unknown; [ -n \"$stack_line\" ] && nx=enabled; printf '%s' \"$stack_line\" | grep -q 'RWE' && nx=disabled;",
		"    if readelf -Ws \"$target\" 2>/dev/null | grep -q '__stack_chk_fail'; then canary=yes; else canary=no; fi;",
		"    if readelf -Ws \"$target\" 2>/dev/null | grep -Eq '(__.*_chk|_chk@)'; then fortify=yes; else fortify=no; fi;",
		`    printf '[${label}] pie=%s nx=%s relro=%s canary=%s fortify=%s type=%s\\n' "$pie" "$nx" "$relro" "$canary" "$fortify" "$elf_type";`,
		"  fi;",
		"fi;",
		'printf "[native-proof-capture] domain=native capture_signals=1 proof_exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n";',
		'printf "[native-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run\\n";',
	].join(" ");
}

export function nativeXrefFallbackCommandTemplate(): string {
	return [
		"adapter-r2-native-xref-runner-fallback: target=<target>;",
		'printf "[native-target] path=%s\\n" "$target";',
		'file "$target" 2>/dev/null || true;',
		nativeMitigationShellSnippet(),
		"if command -v readelf >/dev/null 2>&1; then",
		'  readelf -h "$target" 2>/dev/null | awk \'/Entry point/ {print "[native-entrypoint] " $0}\';',
		'  readelf -Ws "$target" 2>/dev/null | awk \'/FUNC|OBJECT|UND|GLOBAL/ {print "[native-symbol] " $0}\' | head -180;',
		"fi;",
		"if command -v objdump >/dev/null 2>&1; then",
		'  objdump -d "$target" 2>/dev/null | awk \'/<[^>]+>:/ {print "[native-xref] " $0} /\\b(call|jmp|ret)\\b/ {print "[native-branch] " $0}\' | head -260;',
		"fi;",
		"if command -v strings >/dev/null 2>&1; then",
		"  strings -a \"$target\" 2>/dev/null | grep -E -i 'password|license|token|flag|secret|strcmp|memcmp|system|execve|/bin/sh' | sed 's/^/[native-string] /' | head -160 || true;",
		"fi",
		'printf "[native-proof-capture] domain=native capture_signals=1 proof_exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n";',
		'printf "[native-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run\\n";',
	].join(" ");
}

export function nativeDebuggerFallbackCommandTemplate(): string {
	return [
		"adapter-gdb-native-trace-runner-fallback: target=<target>;",
		'printf "[native-debug-target] path=%s\\n" "$target";',
		'file "$target" 2>/dev/null || true;',
		nativeMitigationShellSnippet(),
		"if command -v readelf >/dev/null 2>&1; then",
		'  readelf -h "$target" 2>/dev/null | awk \'/Entry point/ {print "[native-entrypoint] " $0} /Type:/ {print "[native-file-type] " $0} /Machine:/ {print "[native-machine] " $0}\';',
		'  readelf -Ws "$target" 2>/dev/null | awk \'/\\bmain\\b|FUNC|UND/ {print "[native-function] " $0}\' | head -140;',
		"fi;",
		"if command -v objdump >/dev/null 2>&1; then",
		'  objdump -d "$target" 2>/dev/null | awk \'/<main>:/ {print "[native-main] " $0; seen=1} seen && NR < 260 {print "[native-disasm] " $0} /\\b(call|jmp|ret)\\b/ {print "[native-control-flow] " $0}\' | head -260;',
		"fi",
		'printf "[native-proof-capture] domain=native capture_signals=1 proof_exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n";',
		'printf "[native-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run\\n";',
	].join(" ");
}

export function nativeDecompilerSummaryFallbackCommandTemplate(): string {
	return [
		"adapter-ghidra-headless-summary-runner-fallback: target=<target>;",
		'printf "[decompiler-summary-fallback] path=%s\\n" "$target";',
		'file "$target" 2>/dev/null || true;',
		nativeMitigationShellSnippet(),
		"if command -v readelf >/dev/null 2>&1; then",
		'  readelf -h "$target" 2>/dev/null | awk \'/Entry point/ {print "[native-entrypoint] " $0}\';',
		'  readelf -Ws "$target" 2>/dev/null | awk \'/Symbol table/ {print "[native-symbol-table] " $0} /FUNC|OBJECT|UND|GLOBAL|GLIBC/ {print "[native-import-table] " $0}\' | head -220;',
		"fi;",
		"if command -v objdump >/dev/null 2>&1; then",
		'  objdump -T "$target" 2>/dev/null | awk \'/GLIBC|UND|GLOBAL/ {print "[native-dynamic-import] " $0}\' | head -140 || true;',
		'  objdump -d "$target" 2>/dev/null | awk \'/<[^>]+>:/ {print "[function-summary] Function " $0}\' | head -140 || true;',
		"fi",
		'printf "[native-proof-capture] domain=native capture_signals=1 proof_exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n";',
		'printf "[native-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run\\n";',
	].join(" ");
}
