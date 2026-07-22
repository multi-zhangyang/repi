/** Native reverse shell capture command + gdb/pwntools scaffolds (host-tool CAP path). */
import { shellQuote } from "../target.ts";
import { NATIVE_CHECKSEC_SURROGATE_LINES } from "./native-checksec-surrogate.ts";
import { NATIVE_ONE_SECCOMP_HOST_LINES } from "./native-one-seccomp-host.ts";
import { nativeRuntimePwntoolsScaffold } from "./native-pwn-scaffold.ts";
import { NATIVE_R2_MITIGATION_LINES } from "./native-r2-mitigation.ts";
import { NATIVE_RIZIN_HOST_LINES } from "./native-rizin-host.ts";
import { NATIVE_RIZIN_SUITE_LINES } from "./native-rizin-suite.ts";
import { NATIVE_ROP_PURE_LINES } from "./native-rop-pure.ts";
import { NATIVE_DYN_PROBE_LINES } from "./native-shell-dyn.ts";
import { NATIVE_PROOF_CAP_LINES, NATIVE_PROOF_EXIT_LINES } from "./native-shell-proof.ts";
import { NATIVE_SYMBOLIC_HOST_LINES } from "./native-symbolic-host.ts";
import { repiRuntimeWorkdirShell } from "./shared.ts";
export { nativeRuntimePwntoolsScaffold };
// Landmark: CAP_GDB_INFO gdb_info=%s bind_ready proof.exit (body in native-shell-proof.ts)
export function nativeRuntimeGdbScript(): string {
	return `set pagination off
set confirm off
set breakpoint pending on
set disassembly-flavor intel
set follow-fork-mode child
set print pretty on
printf "[native-gdb-script] loaded\\n"
info files
info functions main
info functions strcmp
info functions strncmp
info functions memcmp
info functions strstr
info functions system
break main
rbreak strcmp
rbreak strncmp
rbreak memcmp
rbreak strstr
run
printf "[native-gdb-after-run] stopped\\n"
info registers
bt full
info frame
x/32gx $sp
x/16i $pc
quit`;
}
export function nativeRuntimeShellCommand(target?: string, timeoutMs = 12000): string {
	const targetArg = shellQuote(target?.trim() ?? "");
	const runTimeout = Math.max(3, Math.ceil(timeoutMs / 1000));
	return [
		repiRuntimeWorkdirShell("native-runtime"),
		"set +e",
		`TARGET=${targetArg}`,
		'printf "[native-env] file=%s readelf=%s objdump=%s gdb=%s checksec=%s r2=%s frida=%s ldd=%s strings=%s ROPgadget=%s ropper=%s patchelf=%s\n" "$(command -v file || true)" "$(command -v readelf || true)" "$(command -v objdump || true)" "$(command -v gdb || true)" "$(command -v checksec || true)" "$(command -v r2 || true)" "$(command -v frida || true)" "$(command -v ldd || true)" "$(command -v strings || true)" "$(command -v ROPgadget || true)" "$(command -v ropper || true)" "$(command -v patchelf || true)"',
		`if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then printf "[native-binary] target=%s bytes=%s sha256=%s mode=%s file=%s\\n" "$TARGET" "$(wc -c < "$TARGET" 2>/dev/null || echo 0)" "$(sha256sum "$TARGET" 2>/dev/null | awk '{print $1}')" "$(stat -c "%a" "$TARGET" 2>/dev/null || echo NA)" "$(file -b "$TARGET" 2>/dev/null)"; else printf "[native-binary] target=%s exists=false\\n" "$TARGET"; echo "[native-runtime-blocked] reason=missing_target"; fi`,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v checksec >/dev/null 2>&1; then checksec --file="$TARGET" 2>&1 | sed "s/^/[native-checksec] /"; else echo "[native-runtime-blocked] reason=checksec_binary_missing trying_surrogate"; fi',
		...NATIVE_CHECKSEC_SURROGATE_LINES,
		...NATIVE_ROP_PURE_LINES,
		`if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v rabin2 >/dev/null 2>&1; then rabin2 -I "$TARGET" 2>&1 | sed "s/^/[native-rabin-info] /"; rabin2 -i "$TARGET" 2>/dev/null | head -120 | sed "s/^/[native-rabin-imports] /"; rabin2 -z "$TARGET" 2>/dev/null | grep -iE "flag|license|serial|password|key|admin|debug" | head -80 | sed "s/^/[native-rabin-string] /"; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v r2 >/dev/null 2>&1; then r2 -qq -c "iI; ii; iz~flag,license,serial,password,key,admin,debug; q" "$TARGET" 2>&1 | sed "s/^/[native-r2] /"; r2 -qq -c "iI; q" "$TARGET" 2>/dev/null | awk -F'[ \t]+' '/^nx[[:space:]]/ {print "[native-r2-mitigation] nx="$2} /^pic[[:space:]]/ {print "[native-r2-mitigation] pie="$2} /^canary[[:space:]]/ {print "[native-r2-mitigation] canary="$2} /^relro[[:space:]]/ {print "[native-r2-mitigation] relro="$2}'; else echo "[native-runtime-blocked] reason=rabin2_r2_missing"; fi`,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v ROPgadget >/dev/null 2>&1; then ROPgadget --binary "$TARGET" --only "pop|ret|syscall" 2>/dev/null | head -80 | sed "s/^/[native-ropgadget] /"; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v ropper >/dev/null 2>&1; then ropper --file "$TARGET" --search "pop rdi; ret" 2>/dev/null | head -40 | sed "s/^/[native-ropper] /"; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v r2 >/dev/null 2>&1; then r2 -qq -c "/R pop;ret" "$TARGET" 2>/dev/null | head -60 | sed "s/^/[native-ropgadget] /"; r2 -qq -c "/R ret" "$TARGET" 2>/dev/null | head -20 | sed "s/^/[native-ropgadget] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v readelf >/dev/null 2>&1; then readelf -hW "$TARGET" 2>&1 | head -60 | sed "s/^/[native-readelf-header] /"; readelf -lW "$TARGET" 2>/dev/null | grep -E "GNU_STACK|GNU_RELRO|INTERP|LOAD" | sed "s/^/[native-readelf-program] /"; readelf -dW "$TARGET" 2>/dev/null | grep -E "NEEDED|RPATH|RUNPATH|BIND_NOW" | sed "s/^/[native-readelf-dynamic] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v objdump >/dev/null 2>&1; then objdump -T "$TARGET" 2>/dev/null | grep -Ei "strcmp|strncmp|memcmp|strstr|gets|system|execve|printf|scanf|malloc|free|read|write" | head -80 | sed "s/^/[native-symbol] /"; objdump -d "$TARGET" 2>/dev/null | grep -En "call.*(strcmp|memcmp|strstr|system|gets)|<main>|<win>|<vuln>" | head -80 | sed "s/^/[native-disasm] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v strings >/dev/null 2>&1; then strings -a "$TARGET" 2>/dev/null | grep -iE "flag|license|serial|password|key|/bin/sh|admin|debug|strcmp|memcmp|system" | head -80 | sed "s/^/[native-string] /"; fi',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v ldd >/dev/null 2>&1; then ldd "$TARGET" 2>&1 | sed "s/^/[native-ldd] /"; fi',
		...NATIVE_ONE_SECCOMP_HOST_LINES,
		...NATIVE_SYMBOLIC_HOST_LINES,
		...NATIVE_RIZIN_HOST_LINES,
		...NATIVE_RIZIN_SUITE_LINES,
		repiRuntimeWorkdirShell("native-runtime"),
		"cat > \"$REPI_WORKDIR/native.gdb\" <<'GDB'",
		nativeRuntimeGdbScript(),
		"GDB",
		'echo "[native-gdb-script] $REPI_WORKDIR/native.gdb breakpoints=main,strcmp,strncmp,memcmp,strstr run_env=REPI_NATIVE_RUN"',
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v gdb >/dev/null 2>&1; then timeout 8s gdb -q -batch -ex "set pagination off" -ex "file $TARGET" -ex "info files" -ex "info functions main" -ex "info functions strcmp" -ex "info functions system" -ex "disassemble main" -ex "quit" 2>&1 | head -160 | sed "s/^/[native-gdb-info] /"; echo "[native-gdb-info] host=1 static_batch=1 no_run=1"; else echo "[native-runtime-blocked] reason=gdb_missing_or_target_missing"; fi',
		`if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v gdb >/dev/null 2>&1 && [ "$REPI_NATIVE_RUN" = "1" ]; then timeout ${runTimeout}s gdb -q -batch -x "$REPI_WORKDIR/native.gdb" --args "$TARGET" $REPI_NATIVE_ARGS 2>&1 | sed "s/^/[native-gdb] /"; else echo "[native-gdb] host=1 static_info=1 note=run_gated set_REPI_NATIVE_RUN=1 target=$TARGET"; fi`,
		"cat > \"$REPI_WORKDIR/pwn-scaffold.py\" <<'PY'",
		nativeRuntimePwntoolsScaffold(),
		"PY",
		'echo "[native-pwn-scaffold] $REPI_WORKDIR/pwn-scaffold.py target=$TARGET cyclic=240 rop=leak-libc-verifier"',
		"# reverse proof-capture rollup (machine-readable for structuredSummary)",
		...NATIVE_R2_MITIGATION_LINES,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v objdump >/dev/null 2>&1; then OBJROP=$(objdump -d "$TARGET" 2>/dev/null | grep -E "pop[[:space:]]|[[:space:]]retq?$" | head -20); if [ -n "$OBJROP" ]; then printf "%s\n" "$OBJROP" | sed "s/^/[native-objdump-rop] /"; CAP_ROP=1; fi; fi',
		// Landmark anchors for product-contract joinSources (body lives in native-shell-dyn.ts):
		// native-dyn-probe REPI_NATIVE_DYN default-on (opt-out REPI_NATIVE_DYN=0); lean auto: ! command -v gdb; CAP_GDB on dyn crash path; bind_ready proof.exit
		...NATIVE_PROOF_CAP_LINES,
		...NATIVE_DYN_PROBE_LINES,
		...NATIVE_PROOF_EXIT_LINES,
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v python3 >/dev/null 2>&1; then python3 "$REPI_WORKDIR/pwn-scaffold.py" "$TARGET" 2>&1 | sed "s/^/[native-pwn-scaffold] /"; fi',
	].join("\n");
}
