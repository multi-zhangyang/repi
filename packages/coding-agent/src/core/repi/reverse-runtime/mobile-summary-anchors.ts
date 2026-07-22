/** Mobile runtime anchors. */
/** Mobile runtime anchors/summary/format with reverse proof fields. */

import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { interestingLines, truncateMiddle } from "../text.ts";

export function mobileRuntimeAnchors(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const __anchors = [
		...interestingLines(text, /\[mobile-env\]/i, 8).map(
			(line) => `mobile tool readiness anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-apk\]/i, 8).map(
			(line) => `mobile APK inventory anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-device\]/i, 12).map(
			(line) => `mobile device anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-process\]|\[mobile-frida-process\]/i, 20).map(
			(line) => `mobile process map anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-frida-hook-template\]|\[mobile-hook-line\]/i, 20).map(
			(line) => `mobile Frida hook template anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-crypto-hook\]|\[mobile-compare-hook\]/i, 20).map(
			(line) => `mobile Java crypto/compare hook anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-native-hook\]/i, 20).map(
			(line) => `mobile native compare hook anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-anti-debug/i, 20).map(
			(line) => `mobile anti-debug/root check anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-attach\]/i, 20).map(
			(line) => `mobile runtime attach anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-runtime-blocked\]/i, 12).map(
			(line) => `mobile runtime blocked anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-ssl-pinning\]/i, 20).map(
			(line) => `mobile SSL pinning anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-root-bypass-signal\]/i, 16).map(
			(line) => `mobile root/bypass signal anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[mobile-aapt\]/i, 12).map(
			(line) => `mobile aapt package anchors: ${truncateMiddle(line, 260)}`,
		),
	];
	const tech = reverseRuntimeTechniqueAnchor([
		"mobile-apk-triage-frida-bridge",
		"mobile-ssl-pinning-bypass",
		"mobile-root-bypass",
	]);
	if (tech && !__anchors.includes(tech)) __anchors.push(tech);
	return __anchors.slice(0, 140);
}
