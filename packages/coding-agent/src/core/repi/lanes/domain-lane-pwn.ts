/** Domain lane commands: pwn/report + reverse domain next. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { DomainLaneRuntimeCtx } from "./domain-lane-types.ts";

export function appendDomainLanePwnReverseCommands(
	ctx: DomainLaneRuntimeCtx,
	add: (label: string, command: string, evidence: string) => void,
): void {
	const {
		laneName,
		isNativeRoute,
		isAndroidRoute,
		isPwnRoute,
		isWebRoute,
		isJsRoute,
		targetIsDirectory,
		effectiveTarget,
		targetArg,
		targetPython,
		notes,
	} = ctx;
	if (isPwnRoute) {
		if (targetIsDirectory) {
			notes.push("pwn_target_type=directory；只枚举候选可执行文件，不对目录直接跑 checksec/ldd/crash-seed。");
			add(
				"pwn-directory-executable-candidates",
				`find ${targetArg} -maxdepth 4 -type f \\( -perm -111 -o -name '*.so' -o -name '*.elf' -o -name 'vuln' \\) -exec file {} \\; 2>/dev/null | grep -E 'ELF|PIE|shared object|executable' | tee /tmp/repi-pwn-candidates.txt | head -120`,
				"candidate executables/shared objects for pwn primitive lanes",
			);
			add(
				"pwn-directory-next-lanes",
				`awk -F: '{print $1}' /tmp/repi-pwn-candidates.txt 2>/dev/null | head -40 | sed 's#^#re_lane plan primitive #'`,
				"derive per-candidate primitive lanes instead of crashing the directory path",
			);
		} else {
			add(
				"pwn-mitigations",
				`file ${targetArg}; checksec --file=${targetArg} 2>/dev/null || true; ldd ${targetArg} || true`,
				"mitigations/loader/libc",
			);
			add(
				"crash-seed",
				`python3 - <<'PY'\nfrom subprocess import run, PIPE\np=${targetPython}\nfor n in (16,64,128,256,512):\n    r=run([p], input=b'A'*n, stdout=PIPE, stderr=PIPE, timeout=3)\n    print('n=',n,'code=',r.returncode,'out=',r.stdout[:80],'err=',r.stderr[:80])\nPY`,
				"crash/control seed",
			);
		}
	}

	// reverse: reverse-heavy lanes always seed domain capture next (run-first).
	const reverseBlob = `${laneName} ${isNativeRoute} ${isPwnRoute} ${isAndroidRoute} ${isWebRoute} ${isJsRoute}`;
	const reverseHeavy =
		/native|pwn|android|mobile|web|js|proof|runtime|primitive|verify|exploit|frida|authz/i.test(reverseBlob) ||
		isNativeRoute ||
		isPwnRoute ||
		isAndroidRoute ||
		isWebRoute ||
		isJsRoute;
	if (reverseHeavy) {
		for (const cmd of reverseDomainCaptureNextCommands({
			routeOrBlob: reverseBlob,
			target: effectiveTarget,
		}).slice(0, 4)) {
			add(`reverse-domain-next:${cmd.split(/\s+/)[0]}`, cmd, "reverse domain capture next");
		}
	}
}
