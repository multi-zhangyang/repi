/** Evidence text helpers (truncate/slug). */
import { safeHeadEnd, safeTailStart } from "../../tools/truncate.ts";

export function truncateMiddle(text: string, limit: number): string {
	if (text.length <= limit) return text;
	const head = Math.floor(limit * 0.55);
	const tail = Math.floor(limit * 0.35);
	const headEnd = safeHeadEnd(text, head);
	const tailStart = safeTailStart(text, text.length - tail);
	return `${text.slice(0, headEnd)}\n...<truncated ${text.length - limit} chars>...\n${text.slice(tailStart)}`;
}

export function slug(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}
