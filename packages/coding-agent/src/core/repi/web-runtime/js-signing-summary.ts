/** JS signing anchors/summary/format with reverse proof fields. */
import { reverseRuntimeCaptureProofFields, reverseStructuredProofFields } from "../reverse-capture.ts";
import { reverseRuntimeTechniqueAnchor } from "../reverse-evidence.ts";
import { truncateMiddle } from "../text.ts";
import type { JsSigningArtifact } from "./js-signing-types.ts";

export function jsSigningAnchors(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const patterns = [
		/\[js-signing-env\][^\n]*/gi,
		/\[js-signing-url\][^\n]*/gi,
		/\[js-signing-fetch\][^\n]*/gi,
		/\[repi-js-hook\][^\n]*/gi,
		/\[js-signing-crypto\][^\n]*/gi,
		/\[js-signing-sourcemap\][^\n]*/gi,
		/\[js-signing-script\][^\n]*/gi,
		/\[js-signing-files\][^\n]*/gi,
		/\[js-signing-candidate\][^\n]*/gi,
		/\[repi-signing-rebuild\][^\n]*/gi,
		/\[js-signing-normalized\][^\n]*/gi,
		/\[js-signing-proof-capture\][^\n]*/gi,
		/\[js-signing-blocked\][^\n]*/gi,
	];
	for (const re of patterns) {
		for (const m of text.matchAll(re)) {
			lines.push(truncateMiddle(m[0], 260));
			if (lines.length >= 60) return lines;
		}
	}
	return lines.slice(0, 60);
}

export function jsSigningStructuredSummary(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	const lines: string[] = [];
	const url = /\[js-signing-url\][^\n]*url=(\S+)/i.exec(text)?.[1];
	if (url) lines.push(`summary.url=${truncateMiddle(url, 200)}`);
	const status = /\[js-signing-fetch\][^\n]*status=(\d+)/i.exec(text)?.[1];
	if (status) lines.push(`summary.http_status=${status}`);
	if (/\[repi-js-hook\]/i.test(text)) lines.push("summary.hook_signals=true");
	if (/\[js-signing-crypto\]|crypto\.subtle/i.test(text)) lines.push("summary.crypto_signals=true");
	if (/\[js-signing-sourcemap\]|sourceMappingURL/i.test(text)) lines.push("summary.sourcemap_signals=true");
	if (/\[js-signing-script\]|\[js-signing-files\]/i.test(text)) lines.push("summary.script_signals=true");
	if (/\[repi-signing-rebuild\]/i.test(text)) lines.push("summary.rebuild_scaffold=true");
	if (/\[js-signing-normalized\]/i.test(text)) lines.push("summary.normalized_artifact=true");
	const proofCap = /\[js-signing-proof-capture\]([^\n]*)/i.exec(text)?.[1] || "";
	if (proofCap) {
		for (const part of proofCap.trim().split(/\s+/)) {
			const kv = /^([a-z_]+)=([01])$/i.exec(part);
			if (kv) lines.push(`summary.capture.${kv[1]}=${kv[2]}`);
		}
		lines.push(`summary.proof_capture=${truncateMiddle(proofCap.trim(), 200)}`);
	}
	const techLine = reverseRuntimeTechniqueAnchor([
		"js-sourcemap-secret-harvest",
		"web-browser-state-capture",
		"web-jwt-confusion",
	]);
	for (const proof of reverseStructuredProofFields(techLine ? `[runtime-technique] ${techLine}` : undefined)) {
		if (!lines.includes(proof)) lines.push(proof);
	}
	for (const cap of reverseRuntimeCaptureProofFields("web", text, lines)) {
		if (!lines.includes(cap)) lines.push(cap);
	}
	return lines.slice(0, 40);
}

export function formatJsSigning(artifact: JsSigningArtifact, path?: string): string {
	return [
		"js_signing:",
		path ? `js_signing_artifact: ${path}` : undefined,
		`timestamp: ${artifact.timestamp}`,
		`mode: ${artifact.mode}`,
		`mission_id: ${artifact.missionId ?? "none"}`,
		`route: ${artifact.route ?? "none"}`,
		`target: ${artifact.target ?? artifact.url ?? "<missing>"}`,
		`timeout_ms: ${artifact.timeoutMs}`,
		"structured_summary:",
		...(artifact.structuredSummary.length ? artifact.structuredSummary.map((item) => `- ${item}`) : ["- none"]),
		"runtime_anchors:",
		...(artifact.runtimeAnchors.length
			? artifact.runtimeAnchors.slice(0, 24).map((item) => `- ${item}`)
			: ["- none"]),
		"next_actions:",
		...(artifact.nextActions.length ? artifact.nextActions.map((item) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
