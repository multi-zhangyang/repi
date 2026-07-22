/** Native host CAP flags + proof.exit derivation (machine-readable). */

/** CAP init + host tool flags (CAP_DYN/CAP_CRASH set by dyn probe). */
export const NATIVE_PROOF_CAP_LINES: string[] = [
	"CAP_BIN=0; CAP_CHECKSEC=0; CAP_ROP=0; CAP_SYM=0; CAP_R2=0; CAP_GDB=0; CAP_GDB_INFO=0; CAP_CRASH=0; CAP_ONE=0; CAP_SECCOMP=0; CAP_FRIDA=0; CAP_DYN=0; CAP_SYMBOLIC=${CAP_SYMBOLIC:-0}; CAP_Z3=${CAP_Z3:-0}; CAP_ANGR=${CAP_ANGR:-0}; CAP_QILING=${CAP_QILING:-0}; CAP_RIZIN_SUITE=${CAP_RIZIN_SUITE:-0}; CAP_UNICORN=${CAP_UNICORN:-0}; CAP_UNICORN_EMU=${CAP_UNICORN_EMU:-0}",
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then CAP_BIN=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v checksec >/dev/null 2>&1; then CAP_CHECKSEC=1; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v readelf >/dev/null 2>&1 && readelf -lW "$TARGET" 2>/dev/null | grep -qE "GNU_STACK|GNU_RELRO"; then CAP_CHECKSEC=1; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v r2 >/dev/null 2>&1; then R2I=$(r2 -qq -c "iI; q" "$TARGET" 2>/dev/null); echo "$R2I" | grep -qiE "^(nx|pic|canary|relro)[[:space:]]" && CAP_CHECKSEC=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v ROPgadget >/dev/null 2>&1; then ROPgadget --binary "$TARGET" --only "pop|ret|syscall" 2>/dev/null | head -80 | sed "s/^/[native-ropgadget] /"; CAP_ROP=1; elif [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v ropper >/dev/null 2>&1; then ropper --file "$TARGET" --search "pop" 2>/dev/null | head -40 | sed "s/^/[native-ropper] /"; CAP_ROP=1; fi',
	'if [ "$CAP_ROP" = "0" ] && [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v r2 >/dev/null 2>&1; then R2ROP=$(r2 -qq -c "/R pop;ret" "$TARGET" 2>/dev/null | head -20); if [ -n "$R2ROP" ]; then CAP_ROP=1; printf "%s\\n" "$R2ROP" | sed "s/^/[native-ropgadget] /"; fi; fi',
	'if [ "$CAP_ROP" = "0" ] && [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v objdump >/dev/null 2>&1; then OBJROP=$(objdump -d "$TARGET" 2>/dev/null | grep -E "pop[[:space:]]|[[:space:]]retq?$" | head -40); if [ -n "$OBJROP" ]; then CAP_ROP=1; printf "%s\\n" "$OBJROP" | sed "s/^/[native-objdump-rop] /"; fi; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && { command -v objdump >/dev/null 2>&1 || command -v strings >/dev/null 2>&1 || command -v readelf >/dev/null 2>&1; }; then CAP_SYM=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && { command -v rabin2 >/dev/null 2>&1 || command -v r2 >/dev/null 2>&1; }; then CAP_R2=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v gdb >/dev/null 2>&1; then CAP_GDB_INFO=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v gdb >/dev/null 2>&1 && [ "$REPI_NATIVE_RUN" = "1" ]; then CAP_GDB=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v one_gadget >/dev/null 2>&1; then CAP_ONE=1; fi',
	'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && command -v seccomp-tools >/dev/null 2>&1; then CAP_SECCOMP=1; fi',
	'if command -v frida >/dev/null 2>&1; then CAP_FRIDA=1; FRIDA_VER=$(frida --version 2>/dev/null | head -1); echo "[native-frida] host=1 version=${FRIDA_VER:-unknown}"; if [ -n "$TARGET" ] && [ -e "$TARGET" ]; then file "$TARGET" 2>/dev/null | sed "s/^/[native-frida-target] /"; fi; fi',
];

/** Proof rollup after dyn probe mutates CAP_DYN/CAP_CRASH. */
export const NATIVE_PROOF_EXIT_LINES: string[] = [
	'printf "[native-proof-capture] binary=%s checksec=%s rop=%s symbols=%s r2=%s gdb=%s gdb_info=%s one_gadget=%s seccomp=%s frida=%s dyn=%s crash=%s symbolic=%s unicorn=%s unicorn_emu=%s z3=%s angr=%s qiling=%s rizin_suite=%s\\n" "$CAP_BIN" "$CAP_CHECKSEC" "$CAP_ROP" "$CAP_SYM" "$CAP_R2" "$CAP_GDB" "$CAP_GDB_INFO" "$CAP_ONE" "$CAP_SECCOMP" "$CAP_FRIDA" "$CAP_DYN" "$CAP_CRASH" "${CAP_SYMBOLIC:-0}" "${CAP_UNICORN:-0}" "${CAP_UNICORN_EMU:-0}" "${CAP_Z3:-0}" "${CAP_ANGR:-0}" "${CAP_QILING:-0}" "${CAP_RIZIN_SUITE:-0}"',
	"# derive runtime proof.exit + bind_ready from host CAP rollup (dyn crash/gdb strengthens)",
	'if [ "$CAP_BIN" = "1" ] && [ "$CAP_CHECKSEC" = "1" ] && [ "$CAP_ROP" = "1" ] && { [ "$CAP_FRIDA" = "1" ] || [ "$CAP_DYN" = "1" ] || [ "$CAP_CRASH" = "1" ] || [ "$CAP_R2" = "1" ] || [ "$CAP_GDB_INFO" = "1" ] || [ "$CAP_GDB" = "1" ]; }; then PROOF_EXIT=runtime_capture_strong; BIND=true; elif [ "$CAP_BIN" = "1" ] && { [ "$CAP_CHECKSEC" = "1" ] || [ "$CAP_ROP" = "1" ] || [ "$CAP_R2" = "1" ] || [ "$CAP_FRIDA" = "1" ] || [ "$CAP_GDB_INFO" = "1" ] || [ "$CAP_DYN" = "1" ]; }; then PROOF_EXIT=partial_runtime_capture; BIND=true; else PROOF_EXIT=pending_runtime_capture; BIND=false; fi',
	'printf "[native-proof-capture] proof.exit=%s bind_ready=%s\\n" "$PROOF_EXIT" "$BIND"',
	'printf "summary.proof_exit=%s\\n" "$PROOF_EXIT"',
	'printf "summary.bind_ready=%s\\n" "$BIND"',
	'if [ "$CAP_FRIDA" = "1" ]; then printf "summary.frida_host=1\\n"; fi',
	'if [ "$CAP_DYN" = "1" ]; then printf "summary.dyn_probe=1\\n"; fi',
	'if [ "$CAP_CRASH" = "1" ]; then printf "summary.dyn_crash=1\\n"; fi',
	'if [ "${CAP_SYMBOLIC:-0}" = "1" ]; then printf "summary.symbolic=1\\n"; fi',
	'if [ "${CAP_UNICORN:-0}" = "1" ]; then printf "summary.unicorn=1\\n"; fi',
	'if [ "${CAP_UNICORN_EMU:-0}" = "1" ]; then printf "summary.unicorn_emu=1\\n"; fi',
	'if [ "${CAP_Z3:-0}" = "1" ]; then printf "summary.z3=1\\n"; fi',
	'if [ "${CAP_ANGR:-0}" = "1" ]; then printf "summary.angr=1\\n"; fi',
	'if [ "${CAP_QILING:-0}" = "1" ]; then printf "summary.qiling=1\\n"; fi',
	'if [ "${CAP_RIZIN_SUITE:-0}" = "1" ]; then printf "summary.rizin_suite=1\n"; fi',
	'echo "[native-technique] re_techniques show rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch"',
];
