/** Native runtime structured summary + format with reverse proof fields. */

import {
	prioritizeReverseProofLines,
	reverseRuntimeCaptureProofFields,
	reverseStructuredProofFields,
} from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { truncateMiddle } from "../text.ts";
import { nativeSummaryMitigationAndCapture } from "./native-summary-mitigations.ts";

export function nativeRuntimeStructuredSummary(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const file = /\[native-binary\][^\n]*file=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (file) lines.push(`summary.file=${truncateMiddle(file, 160)}`);
	const sha = /\[native-binary\][^\n]*sha256=([0-9a-f]{16,64})/i.exec(text)?.[1];
	if (sha) lines.push(`summary.sha256=${sha}`);
	const bytes = /\[native-binary\][^\n]*bytes=(\d+)/i.exec(text)?.[1];
	if (bytes) lines.push(`summary.bytes=${bytes}`);
	for (const extra of nativeSummaryMitigationAndCapture(text)) {
		if (!lines.includes(extra)) lines.push(extra);
	}
	let techLine = lines.find((line: any) => /^summary\.technique=/i.test(line))?.replace(/^summary\.technique=/i, "");
	if (techLine && !techLine.startsWith("[")) techLine = `[runtime-technique] ${techLine}`;
	if (!techLine)
		techLine =
			reverseRuntimeTechniqueAnchor([
				"rev-checksec-fingerprint-first",
				"rev-rop-chain-ret2csu",
				"pwn-orw-seccomp-bypass",
				"native-angr-symbolic",
			]) || undefined;
	for (const proof of reverseStructuredProofFields(techLine)) {
		if (!lines.includes(proof)) lines.push(proof);
	}
	for (const cap of reverseRuntimeCaptureProofFields("native", text, lines)) {
		if (!lines.includes(cap)) lines.push(cap);
	}
	// Never drop proof/bind fields with a naive slice — product was stuck at pending.
	return prioritizeReverseProofLines(lines, 48);
}
