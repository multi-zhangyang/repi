/** Mobile runtime structured summary + reverse proof fields. */
/** Mobile runtime anchors/summary/format with reverse proof fields. */

import { reverseRuntimeCaptureProofFields, reverseStructuredProofFields } from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { truncateMiddle } from "../text.ts";

export function mobileRuntimeStructuredSummary(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const apk = /\[mobile-apk\]\s+(.+)/i.exec(text)?.[1];
	if (apk) lines.push(`summary.apk=${truncateMiddle(apk, 200)}`);
	const pkg = /package=([A-Za-z][\w.]*)/.exec(text)?.[1];
	if (pkg) lines.push(`summary.package=${pkg}`);
	const devices = (text.match(/\[mobile-adb\]/gi) || []).length;
	if (devices) lines.push(`summary.adb_lines=${devices}`);
	const frida = (text.match(/\[mobile-frida/gi) || []).length;
	if (frida) lines.push(`summary.frida_lines=${frida}`);
	if (/\[mobile-frida-host\]/i.test(text) || /\[mobile-frida-hook-template\]/i.test(text)) {
		const ver = /\[mobile-frida-host\][^\n]*version=([^\n]+)/i.exec(text)?.[1]?.trim();
		lines.push("summary.frida_host=1");
		if (ver) lines.push(`summary.frida_version=${truncateMiddle(ver, 80)}`);
	}
	const aapt = (text.match(/\[mobile-aapt\]/gi) || []).length;
	if (aapt) lines.push(`summary.aapt_lines=${aapt}`);
	if (/\[mobile-ssl-pinning\]/i.test(text)) lines.push("summary.ssl_pinning_signal=true");
	if (/\[mobile-root-bypass-signal\]|\[mobile-anti-debug/i.test(text)) lines.push("summary.root_debug_signal=true");
	if (!lines.some((l: any) => /summary\.ssl_pinning_signal=true/i.test(l))) {
		const pin = /pinning|TrustManager|OkHttp|SSLContext|\[mobile-ssl-pinning\]/i.test(text);
		if (pin) lines.push("summary.ssl_pinning_signal=true");
	}
	if (!lines.some((l: any) => /summary\.root_debug_signal=true/i.test(l))) {
		const root =
			/su\b|magisk|root detection|isDebuggerConnected|\[mobile-root-bypass-signal\]|\[mobile-anti-debug/i.test(text);
		if (root) lines.push("summary.root_debug_signal=true");
	}
	const blocked = /\[mobile-runtime-blocked\]\s*reason=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (blocked) lines.push(`summary.blocked=${blocked}`);
	const fridaPkg =
		/\[mobile-frida[^\]]*\][^\n]*package[=:]\s*([A-Za-z][\w.]*)/i.exec(text)?.[1] ||
		/\[mobile-apk\][^\n]*package[=:]\s*([A-Za-z][\w.]*)/i.exec(text)?.[1];
	if (fridaPkg) lines.push(`summary.frida_package=${fridaPkg}`);
	const tech = /\[runtime-technique\]\s*(.+)/i.exec(text)?.[1]?.trim();
	if (tech) lines.push(`summary.technique=${truncateMiddle(tech, 200)}`);
	const cap = /\[mobile-proof-capture\]([^\n]*)/i.exec(text)?.[1] || "";
	if (cap) {
		for (const part of cap.trim().split(/\s+/)) {
			const kv = /^([a-z_]+)=([01])$/i.exec(part);
			if (kv) lines.push(`summary.capture.${kv[1]}=${kv[2]}`);
		}
		lines.push(`summary.proof_capture=${truncateMiddle(cap.trim(), 200)}`);
	}
	let techLine = lines.find((line: any) => /^summary\.technique=/i.test(line))?.replace(/^summary\.technique=/i, "");
	if (techLine && !techLine.startsWith("[")) techLine = `[runtime-technique] ${techLine}`;
	if (!techLine)
		techLine =
			reverseRuntimeTechniqueAnchor([
				"mobile-apk-triage-frida-bridge",
				"mobile-ssl-pinning-bypass",
				"mobile-root-bypass",
			]) || undefined;
	for (const proof of reverseStructuredProofFields(techLine)) {
		if (!lines.includes(proof)) lines.push(proof);
	}
	for (const cap of reverseRuntimeCaptureProofFields("mobile", text, lines)) {
		if (!lines.includes(cap)) lines.push(cap);
	}
	return lines.slice(0, 30);
}
