/** Domain-specific lane-run findings/followups (native/web/js/mobile). */

import { interestingLines, truncateMiddle } from "../../text.ts";

export function applyAnalyzeBaseDomainFollowups(params: {
	combined: string;
	lowerRoute: string;
	packTarget?: string;
	targetArg: string;
	addresses: string[];
	addFinding: (finding: string) => void;
	addFollowup: (label: string, command: string, evidence: string) => void;
}): void {
	const { combined, lowerRoute, packTarget, targetArg, addresses, addFinding, addFollowup } = params;
	if (/native|pwn|mobile/.test(lowerRoute)) {
		if (/RELRO|Canary|NX|PIE|RPATH|RUNPATH|ELF|Mach-O|PE32/i.test(combined)) {
			addFinding("binary format/mitigation metadata captured");
		}
		if (packTarget && /strcmp|strncmp|memcmp|strstr|license|serial|valid|invalid|verify|check/i.test(combined)) {
			addFollowup(
				"runtime-compare-breakpoints",
				`gdb -q ${targetArg} -ex 'set pagination off' -ex 'break strcmp' -ex 'break strncmp' -ex 'break memcmp' -ex 'run' -ex 'bt' -ex 'quit'`,
				"runtime comparison call stack and arguments",
			);
			addFollowup(
				"r2-focused-xrefs",
				`r2 -A -q -c 'iz~license,key,serial,valid,invalid,check,verify,fail; afl~main; axt @@ str.*; q' ${targetArg}`,
				"focused xrefs around verification strings",
			);
		}
		if (packTarget && addresses.length > 0) {
			addFollowup(
				"r2-anchor-disassembly",
				`r2 -A -q -c '${addresses
					.slice(0, 4)
					.map((address: any) => `pdf @ ${address}`)
					.join("; ")}; q' ${targetArg}`,
				"disassembly for discovered address anchors",
			);
		}
	}
	if (/web|api/.test(lowerRoute)) {
		const routeLines = interestingLines(
			combined,
			/route|router|app\.|auth|session|jwt|csrf|graphql|websocket|controller/i,
			16,
		);
		if (routeLines.length > 0)
			addFinding(`route/auth anchors: ${routeLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`);
		addFollowup(
			"request-replay-scaffold",
			'rg -n "curl|fetch\\(|axios|supertest|request\\(" .; rg -n "auth|session|jwt|csrf|role|permission|owner" .',
			"request replay and authorization boundary candidates",
		);
	}
	if (/frontend|js/.test(lowerRoute)) {
		const jsLines = interestingLines(
			combined,
			/fetch\(|XMLHttpRequest|WebSocket|crypto|sign|nonce|timestamp|encrypt|decrypt/i,
			16,
		);
		if (jsLines.length > 0)
			addFinding(`JS runtime/signing anchors: ${jsLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`);
		addFollowup(
			"node-rebuild-scaffold",
			'rg -n "sign|nonce|timestamp|crypto|encrypt|decrypt|fetch\\(|XMLHttpRequest" .',
			"minimal JS signing/encryption rebuild candidates",
		);
	}
	if (/android|mobile/.test(lowerRoute)) {
		if (/frida|root|debug|emulator|jadx|smali|JNI|\.so/i.test(combined))
			addFinding("Android anti-analysis/native split anchors captured");
		if (packTarget) {
			addFollowup(
				"jadx-focused-search",
				`tmp=$(mktemp -d); jadx -q -d "$tmp" ${targetArg} >/dev/null 2>&1 && rg -n "license|serial|key|valid|invalid|check|verify|root|debug|frida|token|secret" "$tmp" | head -240`,
				"focused Java/Kotlin verification and anti-analysis call sites",
			);
		}
	}
}
