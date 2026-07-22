/** Web authz structured summary + reverse proof fields. */
/** Web authz anchors/format/summary with reverse proof fields. */

import {
	prioritizeReverseProofLines,
	reverseRuntimeCaptureProofFields,
	reverseStructuredProofFields,
} from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { truncateMiddle } from "../text.ts";

export function webAuthzStructuredSummary(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const principals = Array.from(text.matchAll(/\[web-authz-state\][^\n]*principal=([A-Za-z0-9_-]+)/gi)).map(
		(m: any) => m[1],
	);
	if (principals.length) lines.push(`summary.principals=${Array.from(new Set(principals)).slice(0, 8).join(",")}`);
	const statuses = Array.from(text.matchAll(/\[web-authz-state\][^\n]*status=(\d+|ERR)/gi)).map((m: any) => m[1]);
	if (statuses.length) lines.push(`summary.status_set=${Array.from(new Set(statuses)).slice(0, 12).join(",")}`);
	if (/BOLA|IDOR|authz-diff|principal matrix|potential_bola=true/i.test(text))
		lines.push("summary.authz_diff=observed");
	if (/COOKIE_|AUTH_|Authorization|Set-Cookie/i.test(text)) lines.push("summary.auth_material=observed");
	if (/\[web-authz-matrix\]/i.test(text)) lines.push("summary.route=observed");
	const proofCap = /\[web-authz-proof-capture\]([^\n]*)/i.exec(text)?.[1] || "";
	if (proofCap) {
		for (const part of proofCap.trim().split(/\s+/)) {
			const kv = /^([a-z_]+)=([01]|\d+)$/i.exec(part);
			if (kv) {
				const v = kv[2] === "0" ? "0" : "1";
				lines.push(`summary.capture.${kv[1]}=${v}`);
			}
		}
		lines.push(`summary.proof_capture=${truncateMiddle(proofCap.trim(), 200)}`);
	}
	const techLine = reverseRuntimeTechniqueAnchor([
		"web-authz-bola-matrix",
		"web-session-cookie-diff",
		"web-browser-state-capture",
	]);
	for (const proof of reverseStructuredProofFields(techLine ? `[runtime-technique] ${techLine}` : undefined)) {
		if (!lines.includes(proof)) lines.push(proof);
	}
	for (const cap of reverseRuntimeCaptureProofFields("web_authz", text, lines)) {
		if (!lines.includes(cap)) lines.push(cap);
	}
	return prioritizeReverseProofLines(lines, 48);
}
