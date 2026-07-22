/** Tool-trace pure redact/hash helpers. */
import { createHash } from "node:crypto";
import type { ToolCallTraceEventV1 } from "../runtime-types/failure.ts";

/** reverse: never strip proof.exit / bind_ready / reverse_proof markers from traces */
/** reverse: preserve proof.exit/bind_ready markers for completion/claim gates */
export function toolTraceRedact(value: string): string {
	const text = String(value ?? "");
	const protectedMarkers = Array.from(
		text.matchAll(
			/proof_exit\s*=\s*\S+|bind_ready\s*=\s*\S+|reverse_proof[^\n]*|\[runtime-technique\][^\n]*|partial_runtime_capture|runtime_capture_strong/gi,
		),
	).map((match: any) => match[0]);
	const redacted = text
		.replace(/\bsk-[A-Za-z0-9._-]{8,}\b/g, "<redacted:api-key>")
		.replace(/\bghp_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\bgithub_pat_[A-Za-z0-9_]{16,}\b/g, "<redacted:github-token>")
		.replace(/\b(?:A3T|AKIA|ASIA)[A-Z0-9]{16}\b/g, "<redacted:aws-access-key>")
		.replace(/\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, "<redacted:slack-token>")
		.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "<redacted:jwt>")
		.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "<redacted:private-key>")
		.replace(/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/gi, "$1<redacted:credentials>@")
		.replace(
			/\b(?:ANTHROPIC_AUTH_TOKEN|OPENAI_API_KEY|GITHUB_TOKEN|REPI_[A-Z0-9_]*KEY|API_KEY|TOKEN|PASSWORD|SECRET|ACCESS_KEY|SECRET_KEY|PRIVATE_KEY|CLIENT_SECRET)=([^\s'"]+)/gi,
			(match) => `${match.split("=")[0]}=<redacted>`,
		)
		.replace(/(authorization|x-api-key|api-key)\s*[:=]\s*bearer\s+[A-Za-z0-9._-]+/gi, "$1: Bearer <redacted>")
		.replace(/(authorization|x-api-key|api-key)\s*[:=]\s*[A-Za-z0-9._-]{12,}/gi, "$1: <redacted>")
		.replace(/(cookie|set-cookie)\s*[:=]\s*[^\n\r]+/gi, "$1: <redacted>");
	if (!protectedMarkers.length) return redacted;
	const kept = protectedMarkers.filter((marker: any) => !redacted.includes(marker));
	if (!kept.length) return redacted;
	return `${redacted}\n${kept.join("\n")}`;
}

export function toolTraceHasLiteralSecret(value: string): boolean {
	return /\bsk-[A-Za-z0-9._-]{8,}\b|\bghp_[A-Za-z0-9_]{16,}\b|\bgithub_pat_[A-Za-z0-9_]{16,}\b|\b(?:A3T|AKIA|ASIA)[A-Z0-9]{16}\b|\bxox[abprs]-[A-Za-z0-9-]{10,}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:AUTH_TOKEN|API_KEY|PASSWORD|SECRET|ACCESS_KEY|SECRET_KEY|PRIVATE_KEY|CLIENT_SECRET)=(?!<redacted>)\S+|(?:authorization|x-api-key|api-key)\s*[:=]\s*(?!<redacted>|Bearer <redacted>)(?:bearer\s+)?[A-Za-z0-9._-]{12,}|https?:\/\/[^/\s:@]+:[^/\s@]+@/i.test(
		value,
	);
}

export function toolCallTraceHash(event: Omit<ToolCallTraceEventV1, "eventHash">): string {
	return createHash("sha256").update(stableJson(event)).digest("hex");
}

// The prevHash for the next append IS the eventHash we just appended (the new
// last row), invariant between appends. Cache it per ledger-path instead of
// re-reading the whole ledger on every append just to parse the last line.
// Keyed by path so a changed REPI_CODING_AGENT_DIR (different ledger file) gets
// its own entry — a stale hash from one ledger never seeds another's genesis.
// Invalidated when rotation re-hashes the tail (the last row's eventHash
// changes); repopulated from the rotated last row, or re-read from disk on the
// next append if no entry. Single-writer process (the ledger is only written by
// appendText/rotate here, no cross-process writer) → safe without mtime
// invalidation. No entry = unknown / not-yet-cached; the genesis (empty-file)
// and corrupt-read cases are NOT cached, so a transiently-empty/corrupt ledger
// keeps re-reading until it has a real last-line hash.

export function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return item;
		return Object.keys(item as Record<string, unknown>)
			.sort()
			.reduce<Record<string, unknown>>((out, key) => {
				out[key] = (item as Record<string, unknown>)[key];
				return out;
			}, {});
	});
}

export function textBlocksToString(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.flatMap((part: any) => {
			if (!part || typeof part !== "object") return [];
			const block = part as { type?: unknown; text?: unknown };
			return block.type === "text" && typeof block.text === "string" ? [block.text] : [];
		})
		.join("\n");
}

export function toolTraceFullVerifyEvery(): number {
	const raw = Number(process.env.REPI_TOOL_TRACE_FULL_VERIFY_EVERY);
	if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
	return 256;
}
