/** Live browser structured summary / reverse proof fields. */

import {
	prioritizeReverseProofLines,
	reverseRuntimeCaptureProofFields,
	reverseStructuredProofFields,
} from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { truncateMiddle } from "../text.ts";

export function liveBrowserStructuredSummary(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const status =
		/\[browser-response\][^\n]*status=(\d+)/i.exec(text)?.[1] || /\[browser-status\]\s*(\d+)/i.exec(text)?.[1];
	if (status) lines.push(`summary.http_status=${status}`);
	const url =
		/\[browser-url\]\s*(\S+)/i.exec(text)?.[1] ||
		/\[browser-response\][^\n]*url=([^\s]+)/i.exec(text)?.[1] ||
		/\[browser-request\][^\n]*url=([^\s]+)/i.exec(text)?.[1];
	if (url) lines.push(`summary.url=${truncateMiddle(url, 200)}`);
	const title = /"title"\s*:\s*"([^"]+)"/.exec(text)?.[1];
	if (title) lines.push(`summary.title=${truncateMiddle(title, 120)}`);
	if (/\[browser-websocket\]/i.test(text)) lines.push("summary.websocket=observed");
	if (/\[browser-cookie\]|Set-Cookie|document\.cookie|localStorage|sessionStorage/i.test(text)) {
		lines.push("summary.storage_or_cookie=observed");
		lines.push("summary.set_cookie_signals=true");
	}
	if (
		/\[browser-xhr\]|\[browser-request\][^\n]*resource=(?:xhr|fetch)|\/api\/|graphql|Authorization|Bearer|csrf|xsrf|nonce/i.test(
			text,
		)
	) {
		lines.push("summary.auth_material=observed");
		lines.push("summary.api_signals=true");
	}
	if (/\[browser-script\]|<script\b/i.test(text)) lines.push("summary.script_signals=true");
	if (/\[browser-sourcemap\]|sourceMappingURL|\.map\b/i.test(text)) lines.push("summary.sourcemap_signals=true");
	const proofCap = /\[browser-proof-capture\]([^\n]*)/i.exec(text)?.[1] || "";
	if (proofCap) {
		for (const part of proofCap.trim().split(/\s+/)) {
			const kv = /^([a-z_]+)=([01])$/i.exec(part);
			if (kv) lines.push(`summary.capture.${kv[1]}=${kv[2]}`);
		}
		lines.push(`summary.proof_capture=${truncateMiddle(proofCap.trim(), 200)}`);
	}
	const techLine = reverseRuntimeTechniqueAnchor([
		"web-browser-state-capture",
		"web-authz-bola-matrix",
		"web-session-cookie-diff",
	]);
	for (const proof of reverseStructuredProofFields(techLine ? `[runtime-technique] ${techLine}` : undefined)) {
		if (!lines.includes(proof)) lines.push(proof);
	}
	for (const cap of reverseRuntimeCaptureProofFields("web", text, lines)) {
		if (!lines.includes(cap)) lines.push(cap);
	}
	return prioritizeReverseProofLines(lines, 48);
}
