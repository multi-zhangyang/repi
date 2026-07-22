/** Specialist pack handlers: native/pwn. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsNativeDeep(ctx: SpecialistPackContext): void {
	ctx.specialists.push("native deep reverse/pwn");
	ctx.add(
		"native-runtime-repi-bridge",
		ctx.target
			? `printf '%s\\n' "re_native_runtime run ${ctx.targetArg}" "REPI_NATIVE_RUN=1 re_native_runtime run ${ctx.targetArg}" "re_exploit_lab run ${ctx.targetArg}" "re_exploit_lab run ${ctx.targetArg} 5" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[native-runtime-bridge] target_missing\\n'",
		"bridge to re_native_runtime / re_exploit_lab for mitigations, gdb trace, and local verifier proof",
	);
	ctx.add(
		"native-checksec-fingerprint",
		ctx.target
			? `file ${ctx.targetArg}; sha256sum ${ctx.targetArg}; (command -v checksec >/dev/null && checksec --file=${ctx.targetArg}) || readelf -l ${ctx.targetArg} 2>/dev/null | head -80; (command -v rabin2 >/dev/null && rabin2 -I ${ctx.targetArg}) || true`
			: 'find . -maxdepth 3 -type f -executable | head -40 | while read f; do echo "[bin] $f"; file "$f"; done',
		"binary type, hash, mitigations/imports fingerprint before deep reverse",
	);
	if (!ctx.target) {
		ctx.add(
			"native-deep-ctx.target-discovery",
			'find . -maxdepth 5 -type f -exec sh -c \'file "$1" | grep -Eq "ELF|PE32|Mach-O|WebAssembly|shared object|executable" && printf "[native-candidate] %s\\n" "$1"\' _ {} \\; | head -120',
			"discover concrete native/binary candidates before deep reverse commands",
		);
	}
	if (ctx.target) {
		ctx.add(
			"native-deep-symbol-map-scaffold",
			`cat > /tmp/repi-native-symbol-map.sh <<'SH'\nset +e\nTARGET="$1"\nprintf '[native-symbol-map] ctx.target=%s\\n' "$TARGET"\nfile "$TARGET" 2>/dev/null | sed 's/^/[native-symbol] file=/'\nsha256sum "$TARGET" 2>/dev/null | awk '{print "[native-symbol] sha256="$1" path="$2}'\nreadelf -hW "$TARGET" 2>/dev/null | sed -n '1,80p' | sed 's/^/[native-header] /'\nreadelf -SW "$TARGET" 2>/dev/null | sed -n '1,120p' | sed 's/^/[native-section] /'\nreadelf -sW "$TARGET" 2>/dev/null | grep -Ei ' main$|strcmp|strncmp|memcmp|strstr|scanf|gets|printf|system|execve|open|read|write|socket|connect|crypto|verify|check|license|serial|flag' | head -180 | sed 's/^/[native-symbol] /'\nobjdump -T "$TARGET" 2>/dev/null | grep -Ei 'GLIBC|strcmp|strncmp|memcmp|strstr|printf|puts|system|read|write|open|socket|connect|crypto' | head -160 | sed 's/^/[native-import] /'\nrabin2 -I "$TARGET" 2>/dev/null | sed -n '1,80p' | sed 's/^/[native-rabin2] /'\nrabin2 -i "$TARGET" 2>/dev/null | head -160 | sed 's/^/[native-import] /'\nstrings -a -n 5 "$TARGET" 2>/dev/null | grep -Ei 'license|serial|key|valid|invalid|verify|check|flag|pass|fail|success|denied|admin|debug|http|token|secret' | head -220 | sed 's/^/[native-string] /'\nSH\nchmod +x /tmp/repi-native-symbol-map.sh\n/tmp/repi-native-symbol-map.sh ${ctx.targetArg}`,
			"native symbol/import/section/string map with readelf/objdump/rabin2 fallbacks",
		);
		ctx.add(
			"native-deep-decompiler-project-scaffold",
			`cat > /tmp/repi-ghidra-import.sh <<'SH'\nset +e\nTARGET="$1"\nOUT="\${REPI_GHIDRA_OUT:-/tmp/repi-ghidra-project}"\nSCRIPT="/tmp/repi-ghidra-export.java"\nprintf '[native-decompiler] ctx.target=%s out=%s\\n' "$TARGET" "$OUT"\ncat > "$SCRIPT" <<'JAVA'\n// REPI Ghidra headless export scaffold. Run with analyzeHeadless if Ghidra is installed.\nimport ghidra.app.script.GhidraScript;\npublic class RepiExport extends GhidraScript { public void run() throws Exception { println("[native-decompiler] program=" + currentProgram.getName()); println("[native-decompiler] imageBase=" + currentProgram.getImageBase()); } }\nJAVA\nif command -v analyzeHeadless >/dev/null 2>&1; then\n  mkdir -p "$OUT"\n  analyzeHeadless "$OUT" repi -import "$TARGET" -postScript "$SCRIPT" -deleteProject 2>&1 | sed -n '1,220p' | sed 's/^/[native-decompiler] /'\nelse\n  printf '[native-decompiler] analyzeHeadless=missing script=%s\\n' "$SCRIPT"\n  command -v r2 >/dev/null 2>&1 && r2 -A -q -c 'aaa; afl~main,sym.; iz~license,key,serial,valid,invalid,flag; s main; pdf; q' "$TARGET" 2>/dev/null | head -260 | sed 's/^/[native-decompiler-fallback] /'\nfi\nSH\nchmod +x /tmp/repi-ghidra-import.sh\n/tmp/repi-ghidra-import.sh ${ctx.targetArg}`,
			"Ghidra headless import/export scaffold with r2 decompiler fallback for control-flow anchors",
		);
		ctx.add(
			"native-deep-compare-trace-scaffold",
			`cat > /tmp/repi-native-compare-trace.gdb <<'GDB'\nset pagination off\nset disassembly-flavor intel\nset follow-fork-mode child\nset breakpoint pending on\nbreak strcmp\ncommands\nsilent\nprintf "[native-compare] fn=strcmp a=%s b=%s rip=%p\\n", $rdi, $rsi, $rip\nbt 4\ncontinue\nend\nbreak strncmp\ncommands\nsilent\nprintf "[native-compare] fn=strncmp a=%s b=%s n=%ld rip=%p\\n", $rdi, $rsi, $rdx, $rip\nbt 4\ncontinue\nend\nbreak memcmp\ncommands\nsilent\nprintf "[native-compare] fn=memcmp a=%p b=%p n=%ld rip=%p\\n", $rdi, $rsi, $rdx, $rip\nx/16bx $rdi\nx/16bx $rsi\nbt 4\ncontinue\nend\nrun\ninfo registers\nx/24gx $rsp\nquit\nGDB\nprintf '[native-compare-trace] script=/tmp/repi-native-compare-trace.gdb ctx.target=%s\\n' ${ctx.targetArg}\nprintf 'run: gdb -q %s -x /tmp/repi-native-compare-trace.gdb\\n' ${ctx.targetArg}`,
			"GDB comparison breakpoint trace scaffold capturing strcmp/strncmp/memcmp args, backtrace, registers, and stack",
		);
		ctx.add(
			"native-deep-patch-hypothesis-scaffold",
			`python3 - <<'PY'\nimport json, os, pathlib, re, subprocess, sys\ntarget=${ctx.targetPython}\nprint('[native-patch] ctx.target=' + ctx.target)\ntry:\n    out=subprocess.run(['objdump','-d','-Mintel',ctx.target], text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=20).stdout\nexcept Exception as exc:\n    print('[native-patch] objdump_error=' + type(exc).__name__ + ':' + str(exc)[:160]); out=''\npatterns=re.compile(r'\\b(jz|je|jnz|jne|ja|jb|jg|jl|jge|jle|cmp|test|call)\\b.*?(strcmp|strncmp|memcmp|verify|check|license|serial|flag|fail|success)?', re.I)\ncandidates=[]\nfor line in out.splitlines():\n    if patterns.search(line):\n        candidates.append(line.strip())\n        if len(candidates) >= 80: break\npath=pathlib.Path('/tmp/repi-native-patch-candidates.json')\npath.write_text(json.dumps({'ctx.target':ctx.target,'candidates':candidates}, indent=2))\nprint('[native-patch] candidates=' + str(len(candidates)) + ' artifact=' + str(path))\nfor line in candidates[:30]: print('[native-patch-candidate]', line)\nprint('[native-patch] next=prove branch condition with native-deep-compare-trace before patching bytes')\nPY`,
			"branch/compare patch hypothesis scaffold that emits candidate jump/cmp/test sites without mutating ctx.target",
		);
		ctx.add(
			"native-deep-symbolic-fuzz-scaffold",
			`cat > /tmp/repi-native-symbolic-fuzz.py <<'PY'\n#!/usr/bin/env python3\nimport os, pathlib, subprocess, sys, tempfile, time\ntarget=sys.argv[1]\nprint('[native-symbolic] ctx.target=' + ctx.target)\ntry:\n    import angr  # type: ignore\n    project=angr.Project(ctx.target, auto_load_libs=False)\n    print('[native-symbolic] angr=present arch=' + str(project.arch) + ' entry=' + hex(project.entry))\n    cfg=project.analyses.CFGFast(normalize=True)\n    print('[native-symbolic] cfg_functions=' + str(len(cfg.kb.functions)))\n    for addr, fn in list(cfg.kb.functions.items())[:80]:\n        name=getattr(fn, 'name', '')\n        if any(x in name.lower() for x in ['main','check','verify','license','serial','strcmp','memcmp']): print('[native-symbolic-fn]', hex(addr), name)\nexcept Exception as exc:\n    print('[native-symbolic] angr=missing_or_failed error=' + type(exc).__name__ + ':' + str(exc)[:160])\nseeds=[b'', b'A'*8, b'A'*32, b'flag\\n', b'license\\n', b'123456\\n']\nfor i, data in enumerate(seeds):\n    try:\n        started=time.time(); r=subprocess.run([ctx.target], input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=3)\n        print('[native-fuzz] seed=%d len=%d exit=%s ms=%d stdout=%r stderr=%r' % (i,len(data),r.returncode,int((time.time()-started)*1000),r.stdout[:80],r.stderr[:80]))\n    except Exception as exc:\n        print('[native-fuzz] seed=%d error=%s:%s' % (i,type(exc).__name__,str(exc)[:120]))\nPY\nchmod +x /tmp/repi-native-symbolic-fuzz.py\npython3 /tmp/repi-native-symbolic-fuzz.py ${ctx.targetArg}`,
			"angr/CFG symbolic scaffold plus bounded seed fuzz smoke test for control-flow and crash anchors",
		);
	}
}
