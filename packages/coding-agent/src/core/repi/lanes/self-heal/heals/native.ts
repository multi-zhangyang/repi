import type { SelfHealCtx } from "./ctx.ts";

export function appendNativeHeals(ctx: SelfHealCtx): void {
	const {
		pack: _pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (target && /native|pwn|reverse|binary|elf|mobile/.test(route)) {
		add(
			"heal-native-baseline",
			`file ${target}; sha256sum ${target}; strings -a -n 5 ${target} | grep -iE 'license|serial|key|valid|invalid|check|verify|flag|pass|fail|strcmp|memcmp' | head -180`,
			"baseline binary metadata and verification strings",
		);
		add(
			"heal-native-control-scan",
			`readelf -hW ${target}; readelf -sW ${target} 2>/dev/null | grep -iE 'main|strcmp|memcmp|license|verify|check' | head -160; objdump -d -Mintel ${target} 2>/dev/null | grep -iE 'strcmp|memcmp|strncmp|license|serial|key|valid|invalid' -C 10 | head -260 || true`,
			"alternate control-flow anchors without heavyweight tooling",
		);
		add(
			"heal-native-deep-symbol-map",
			`[ -x /tmp/repi-native-symbol-map.sh ] && /tmp/repi-native-symbol-map.sh ${target} || { readelf -SW ${target} 2>/dev/null; objdump -T ${target} 2>/dev/null; strings -a -n 5 ${target} | grep -Ei 'license|serial|key|valid|invalid|verify|check|flag|strcmp|memcmp' | head -220; }`,
			"native-deep fallback for symbol/import/section/string anchors",
		);
		add(
			"heal-native-deep-symbolic-fuzz",
			`[ -f /tmp/repi-native-symbolic-fuzz.py ] && python3 /tmp/repi-native-symbolic-fuzz.py ${target} || printf '%s\n' 'rerun native-deep-symbolic-fuzz-scaffold after lane plan'`,
			"native-deep fallback for CFG/symbolic/fuzz anchors",
		);
	}
}
