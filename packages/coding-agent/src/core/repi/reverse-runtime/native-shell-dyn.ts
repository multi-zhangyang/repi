/** Native dynamic crash probe lines (lean host / reverse product default-on). */
/** Unique cyclic + gdb *($rsp) exact ret-offset when crash observed. */

export const NATIVE_DYN_PROBE_LINES: string[] = [
	// Default ON for reverse product harness when target is executable.
	// Opt-out: REPI_NATIVE_DYN=0. Explicit force: REPI_NATIVE_RUN=1 or REPI_NATIVE_DYN=1.
	// Lean hosts without gdb still auto-run via `! command -v gdb`.
	[
		'if [ -n "$TARGET" ] && [ -e "$TARGET" ] && [ -x "$TARGET" ] && { [ "$REPI_NATIVE_RUN" = "1" ] || [ "${REPI_NATIVE_DYN:-1}" != "0" ] || ! command -v gdb >/dev/null 2>&1; }; then',
		'  CYC=$(python3 -c \'o=[];i=0\nwhile len(o)<240:o.append("%04d"%i);i+=1\nprint("".join(o)[:240])\')',
		'  printf "%s\\n" "$CYC" > /tmp/repi-native-cyclic.txt',
		"  set +e",
		'  OUT=$(printf "%s\\n" "$CYC" | timeout 2s "$TARGET" 2>&1)',
		"  EC=$?",
		"  SIG_NOTE=none; if [ $EC -eq 124 ]; then SIG_NOTE=timeout; elif [ $EC -gt 128 ]; then SIG_NOTE=signal_$((EC-128)); elif [ $EC -eq 139 ]; then SIG_NOTE=signal_11; fi",
		'  printf "[native-dyn-probe] exit=%s timeout_or_signal=%s cyclic_len=%s\\n" "$EC" "$SIG_NOTE" "${#CYC}"',
		'  printf "%s\\n" "$OUT" | head -40 | sed "s/^/[native-dyn-output] /"',
		'  if [ $EC -gt 128 ] || [ $EC -eq 139 ] || [ $EC -eq 124 ] || printf "%s\\n" "$OUT" | grep -qiE "SIGSEGV|segmentation fault|AddressSanitizer|stack smashing|dumped core"; then',
		'    echo "[native-dyn-probe] crash=1"; CAP_CRASH=1',
		"    if command -v gdb >/dev/null 2>&1; then",
		"    cat > /tmp/repi-native-offset.gdb <<'GDB'",
		"set pagination off",
		"set confirm off",
		"run < /tmp/repi-native-cyclic.txt",
		'printf "[native-dyn-stack] RSP0=0x%lx\\n", *(unsigned long*)$rsp',
		"x/2gx $rsp",
		"quit",
		"GDB",
		'      GOUT=$(timeout 6s gdb -q -batch -x /tmp/repi-native-offset.gdb --args "$TARGET" 2>&1 || true)',
		'      printf "%s\\n" "$GOUT" | grep -E "SIGSEGV|native-dyn-stack|0x[0-9a-f]+:" | head -12 | sed "s/^/[native-dyn-gdb] /"',
		"      # Live dyn crash path that exercised gdb counts as CAP_GDB (not only REPI_NATIVE_RUN full script).",
		"      CAP_GDB=1",
		'      STACK=$(printf "%s\\n" "$GOUT" | sed -n "s/.*RSP0=0x\\([0-9a-fA-F]*\\).*/\\1/p" | head -1)',
		'      if [ -n "$STACK" ]; then',
		'        IDX=$(python3 -c "p=open(\\"/tmp/repi-native-cyclic.txt\\",\\"rb\\").read().strip(); h=\\"$STACK\\".lower(); b=bytes.fromhex(h)[::-1]; i=p.find(b if len(b)<=8 else b[-8:]); print(i if i>=0 else p.find(b[:4]))")',
		'        if [ "$IDX" != "-1" ]; then echo "[native-dyn-offset] exact=$IDX method=gdb-rsp0-le reg=0x$STACK"; printf "summary.dyn_exact_offset=%s\\n" "$IDX"; else echo "[native-dyn-offset] exact=unknown method=gdb-rsp0-present reg=0x$STACK"; fi',
		'      else echo "[native-dyn-offset] exact=unknown method=gdb-no-stack-word"; fi',
		'    else echo "[native-dyn-offset] exact=unknown method=gdb_missing note=signal_or_core_only"; fi',
		"  fi",
		"  CAP_DYN=1",
		'  printf "[native-dyn-probe] ok=1 dyn=1 crash=%s gdb=%s\\n" "${CAP_CRASH:-0}" "${CAP_GDB:-0}"',
		'else echo "[native-runtime-blocked] reason=dyn_probe_skipped_nonexec_or_gated set_REPI_NATIVE_DYN=1"; fi',
	].join("\n"),
];
