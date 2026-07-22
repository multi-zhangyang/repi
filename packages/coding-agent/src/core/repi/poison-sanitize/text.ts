/** Redact/sanitize memory text fields (poison + sensitive). */

import { looksLikeNaturalLanguageTarget } from "../decision-runtime/deps.ts";
import { REPI_POISON_PATTERNS } from "../target.ts";
import { sha256Text, truncateMiddle } from "../text.ts";
import { toolTraceRedact } from "../tool-trace/pure.ts";
import { containsRepiPoison } from "./config.ts";

export function redactMemorySensitiveText(value: string): string {
	return toolTraceRedact(value)
		.replace(
			/((?:baseUrl|baseURL|endpoint|url)"?\s*[:=]\s*"?)(https?:\/\/[^\s"',}]+)/gi,
			(_match, prefix, url) => `${prefix}<redacted:url:${sha256Text(url).slice(0, 16)}>`,
		)
		.replace(/\bhttps?:\/\/api\.[^\s"',}<)]+/gi, (url) => `<redacted:url:${sha256Text(url).slice(0, 16)}>`);
}

export function redactRepiPoisonText(text: string): string {
	let out = text;
	for (const pattern of REPI_POISON_PATTERNS) out = out.replace(pattern, "[REPI_POISON_REDACTED]");
	return out.replace(/😅/g, "");
}

export function sanitizeMemoryText(value?: string, fallback?: string): string | undefined {
	const text = value?.trim();
	if (!text) return fallback;
	const redacted = redactMemorySensitiveText(text);
	if (containsRepiPoison(redacted)) return fallback;
	return truncateMiddle(redacted, 4000);
}

export function sanitizeMemoryCaseSignature(value?: string): string | undefined {
	const text = sanitizeMemoryText(value);
	if (!text || containsRepiPoison(text)) return undefined;
	return /^[a-z0-9:_-]{8,96}$/i.test(text) ? text : undefined;
}

export function sanitizeMemoryRoute(value?: string, fallback = "manual"): string {
	const text = sanitizeMemoryText(value, fallback) ?? fallback;
	return looksLikeNaturalLanguageTarget(text) ? fallback : truncateMiddle(text, 160);
}

export function sanitizeMemoryTag(value?: string): string | undefined {
	const text = sanitizeMemoryText(value);
	if (!text || looksLikeNaturalLanguageTarget(text)) return undefined;
	return truncateMiddle(text.replace(/\s+/g, "-"), 120);
}
