/** Native deep reverse signal collection. */
import { interestingLines, truncateMiddle } from "../../../text.ts";

export function collectNativeDeepSignals(
	combined: string,
	findings: string[],
): {
	symbolLines: string[];
	decompilerLines: string[];
	compareLines: string[];
	patchLines: string[];
	symbolicLines: string[];
	fuzzLines: string[];
} {
	const symbolLines = interestingLines(
		combined,
		/\[native-symbol-map\]|\[native-header\]|\[native-section\]|\[native-symbol\]|\[native-import\]|\[native-string\]|\[native-rabin2\]/i,
		28,
	);
	if (symbolLines.length > 0) {
		findings.push(
			`Native deep symbol/import/string anchors: ${symbolLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const decompilerLines = interestingLines(
		combined,
		/\[native-decompiler\]|\[native-decompiler-fallback\]|analyzeHeadless|Ghidra|pdf @|afl|iz~/i,
		18,
	);
	if (decompilerLines.length > 0) {
		findings.push(
			`Native decompiler/control-flow anchors: ${decompilerLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const compareLines = interestingLines(
		combined,
		/\[native-compare\]|\[native-compare-trace\]|Breakpoint .*strcmp|Breakpoint .*memcmp|fn=(?:strcmp|strncmp|memcmp)/i,
		18,
	);
	if (compareLines.length > 0) {
		findings.push(
			`Native compare trace anchors: ${compareLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const patchLines = interestingLines(combined, /\[native-patch\]|\[native-patch-candidate\]/i, 18);
	if (patchLines.length > 0) {
		findings.push(
			`Native patch hypothesis anchors: ${patchLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const symbolicLines = interestingLines(
		combined,
		/\[native-symbolic\]|\[native-symbolic-fn\]|angr=present|cfg_functions/i,
		16,
	);
	if (symbolicLines.length > 0) {
		findings.push(
			`Native symbolic/CFG anchors: ${symbolicLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const fuzzLines = interestingLines(combined, /\[native-fuzz\]|SIGSEGV|AddressSanitizer|crash|exit=-?11/i, 18);
	if (fuzzLines.length > 0) {
		findings.push(
			`Native fuzz/crash anchors: ${fuzzLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	return { symbolLines, decompilerLines, compareLines, patchLines, symbolicLines, fuzzLines };
}
