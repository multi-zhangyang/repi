/** Native runtime anchors with reverse technique bridges. */
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { interestingLines, truncateMiddle } from "../text.ts";

export function nativeRuntimeAnchors(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const __anchors = [
		...interestingLines(text, /\[native-env\]/i, 8).map(
			(line) => `native tool readiness anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-binary\]|\[native-file\]/i, 8).map(
			(line) => `native binary inventory anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-checksec\]|\[native-readelf/i, 24).map(
			(line) => `native mitigation/header anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-ldd\]/i, 16).map(
			(line) => `native loader/libc anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-symbol\]|\[native-disasm\]|\[native-string\]/i, 30).map(
			(line) => `native symbol/string anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-rabin-|\[native-r2\]/i, 40).map(
			(line) => `native r2/rabin triage anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-ropgadget\]|\[native-ropper\]|\[native-objdump-rop\]/i, 24).map(
			(line) => `native ROP gadget anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-gdb-script\]|\[native-gdb\]/i, 40).map(
			(line) => `native GDB trace anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /SIGSEGV|Program received signal|RIP|RSP|EIP|ESP|info registers|bt|backtrace/i, 30).map(
			(line) => `native crash/register anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-one-gadget\]/i, 16).map(
			(line) => `native one_gadget anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-seccomp\]/i, 16).map(
			(line) => `native seccomp filter anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-pwn-scaffold\]/i, 12).map(
			(line) => `native exploit scaffold anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-runtime-blocked\]/i, 12).map(
			(line) => `native runtime blocked anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-technique\]/i, 6).map(
			(line) => `native technique bridges: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-frida\]|\[native-frida-target\]/i, 12).map(
			(line) => `native frida host anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[native-objdump-rop\]/i, 16).map(
			(line) => `native objdump ROP surrogate anchors: ${truncateMiddle(line, 260)}`,
		),
	];
	const tech = reverseRuntimeTechniqueAnchor([
		"rev-checksec-fingerprint-first",
		"rev-rop-chain-ret2csu",
		"pwn-orw-seccomp-bypass",
		"native-angr-symbolic",
	]);
	if (tech && !__anchors.includes(tech)) __anchors.push(tech);
	return __anchors.slice(0, 120);
}
