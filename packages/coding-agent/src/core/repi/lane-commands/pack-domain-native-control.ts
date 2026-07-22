import type { LaneDomainPackCtx } from "./pack-domain-types.ts";
export function appendLaneDomainNativeControl(ctx: LaneDomainPackCtx): void {
	const {
		laneName,
		isNativeRoute,
		isAndroidRoute,
		targetIsDirectory: _targetIsDirectory,
		effectiveTarget: _effectiveTarget,
		targetArg,
		targetPython: _targetPython,
		add,
		notes: _notes,
	} = ctx;
	if (isAndroidRoute && /control|flow|prove/.test(laneName)) {
		add(
			"jadx-keyword-map",
			`tmp=$(mktemp -d); jadx -q -d "$tmp" ${targetArg} >/dev/null 2>&1 && rg -n "license|serial|key|valid|invalid|check|verify|root|debug|frida|token|secret" "$tmp" | head -220`,
			"Java/Kotlin keyword call sites",
		);
		add(
			"native-lib-map",
			`unzip -l ${targetArg} | awk '/\\.so$/ {print $4}' | head -80`,
			"native library names for split native triage",
		);
	}

	if (isNativeRoute && /control|flow|prove/.test(laneName)) {
		add(
			"r2-xrefs",
			`r2 -A -q -c 'iz~license,key,serial,valid,invalid,check,verify,fail; afl~main; afl~sym.; ii; q' ${targetArg}`,
			"strings, functions, imports, xrefs seed",
		);
		add(
			"objdump-control",
			`objdump -d -Mintel ${targetArg} | grep -iE 'strcmp|memcmp|strncmp|license|serial|key|valid|invalid' -C 8 | head -220`,
			"control-flow hints",
		);
	}
}
