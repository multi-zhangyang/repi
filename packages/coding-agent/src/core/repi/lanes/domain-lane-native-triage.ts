import type { DomainLaneRuntimeCtx } from "./domain-lane-types.ts";

type AddFn = (label: string, command: string, evidence: string) => void;
export function appendDomainLaneNativeTriage(ctx: DomainLaneRuntimeCtx, add: AddFn): void {
	const {
		laneName,
		isNativeRoute,
		isAndroidRoute,
		isPwnRoute,
		targetIsDirectory,
		effectiveTarget,
		targetArg,
		targetPython: _targetPython,
		notes,
	} = ctx;
	if (isNativeRoute || (isPwnRoute && /triage|map|mitigation/.test(laneName))) {
		if (targetIsDirectory) {
			notes.push("target_type=directory；先做目录级候选筛选，不对目录直接执行 readelf/objdump/rabin2/checksec。");
			add(
				"directory-triage-file-list",
				`find ${targetArg} -maxdepth 4 -type f \\( -path '*/.git/*' -o -path '*/node_modules/*' \\) -prune -o -type f -printf '%p\\n' 2>/dev/null | sort | head -300`,
				"directory file inventory for target selection",
			);
			add(
				"directory-triage-file-map",
				`find ${targetArg} -maxdepth 4 -type f -exec file {} \\; 2>/dev/null | tee /tmp/repi-directory-file-map.txt | grep -E 'ELF|PE32|Mach-O|WebAssembly|script|Zip archive|Android package|pcap' | head -160`,
				"typed candidate map: binaries, scripts, archives, APKs and PCAPs",
			);
			add(
				"directory-triage-candidates",
				`awk -F: '/ELF|PE32|Mach-O|WebAssembly|script|Zip archive|Android package|pcap/ {print $1}' /tmp/repi-directory-file-map.txt 2>/dev/null | head -80`,
				"candidate files to feed into re_lane plan <lane> <candidate> or re_native_runtime run <candidate>",
			);
		} else if (!effectiveTarget) {
			add(
				"discover-elf-candidates",
				'find . -maxdepth 3 -type f -exec sh -c \'file "$1" | grep -q "ELF" && printf "%s\\n" "$1"\' _ {} \\; | head -40',
				"candidate target paths",
			);
		} else {
			add("file-hash", `file ${targetArg} && sha256sum ${targetArg}`, "format, architecture, hash");
			add(
				"headers-imports",
				`readelf -hW ${targetArg}; readelf -dW ${targetArg} 2>/dev/null || true`,
				"ELF headers and dynamic section",
			);
			add(
				"strings-interesting",
				`strings -a -n 5 ${targetArg} | grep -iE 'license|serial|key|valid|invalid|check|verify|flag|pass|fail|error' | head -120`,
				"interesting strings",
			);
			add(
				"symbols-imports",
				`rabin2 -I ${targetArg} 2>/dev/null; rabin2 -i ${targetArg} 2>/dev/null | head -120`,
				"r2 binary info/imports",
			);
			add("checksec", `checksec --file=${targetArg} 2>/dev/null || true`, "binary mitigations");
		}
	}

	if (isAndroidRoute && /triage|map|manifest/.test(laneName)) {
		add("apk-file-hash", `file ${targetArg} && sha256sum ${targetArg}`, "APK/container format and hash");
		add("apk-list", `unzip -l ${targetArg} | head -160`, "APK top-level entries and native libraries");
		add("apk-manifest", `aapt dump badging ${targetArg} 2>/dev/null || true`, "package/activity/sdk metadata");
		add(
			"apk-interesting-strings",
			`strings -a -n 5 ${targetArg} | grep -iE 'license|serial|key|valid|invalid|check|verify|flag|token|secret|frida|root|debug' | head -160`,
			"APK/native interesting strings",
		);
	}
}
