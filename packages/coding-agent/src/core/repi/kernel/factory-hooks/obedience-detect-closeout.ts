/** Closeout validators for product obedience (HARNESS/PROOF + bind_ready). */

import type { ObedienceViolation } from "./obedience-detect.ts";

/** Plain two-line closeout is valid only when PROOF asserts bind_ready=true. */
export function hasValidPlainCloseout(lines: string[]): boolean {
	const harnessOk = lines.some((line) => /^\s*(\*\*)?HARNESS_BUGS(\*\*)?\s*:\s*none\b/i.test(line));
	const proofOk = lines.some(
		(line) =>
			/^\s*(\*\*)?PROOF(\*\*)?\s*:/i.test(line) &&
			/bind_ready\s*=\s*true/i.test(line) &&
			!/bind_ready\s*=\s*false/i.test(line),
	);
	return harnessOk && proofOk;
}

/** Reverse closeout missing after proof is bound / complete ready. */
export function detectMissingCloseout(
	text: string,
	opts: { reverseBound: boolean; completeReady: boolean },
): ObedienceViolation | undefined {
	if (!opts.reverseBound && !opts.completeReady) return undefined;
	const t = String(text ?? "");
	const lines = t.split(/\r?\n/);
	// Valid two-line closeout (HARNESS none + PROOF bind_ready=true) wins.
	if (hasValidPlainCloseout(lines)) return undefined;
	// HARNESS none + PROOF present but bind_ready=false / missing → force correction.
	const hasHarnessNone = lines.some((line) => /^\s*(\*\*)?HARNESS_BUGS(\*\*)?\s*:\s*none\b/i.test(line));
	const hasProof = lines.some((line) => /^\s*(\*\*)?PROOF(\*\*)?\s*:/i.test(line));
	if (hasHarnessNone && hasProof) {
		return {
			kind: "missing_closeout",
			snippet:
				lines.find((line) => /^\s*(\*\*)?PROOF(\*\*)?\s*:/i.test(line))?.slice(0, 160) ?? "bind_ready missing",
		};
	}
	// Only fire when model produced a substantial narrative without skeleton
	if (t.trim().length < 40) return undefined;
	return {
		kind: "missing_closeout",
		snippet: t.slice(0, 120).replace(/\s+/g, " ").trim(),
	};
}

/**
 * When reverse is bound, HARNESS_BUGS must be tool failures only.
 * Models often invent "missing target" / target findings as HARNESS_BUGS.
 */
export function detectHarnessMislabel(
	text: string,
	opts: { reverseBound: boolean; completeReady: boolean },
): ObedienceViolation | undefined {
	if (!opts.reverseBound && !opts.completeReady) return undefined;
	const t = String(text ?? "");
	const lines = t.split(/\r?\n/);
	// Final plain closeout with bind_ready=true short-circuits earlier bleed lines.
	if (hasValidPlainCloseout(lines)) return undefined;

	for (const line of lines) {
		const m = /^\s*(\*\*)?HARNESS_BUGS(\*\*)?\s*:\s*(.*)$/i.exec(line);
		if (!m) continue;
		const body = String(m[3] ?? "").trim();
		if (!body || /^none\b/i.test(body) || /^n\/?a\b/i.test(body) || body === "-" || body === "—") {
			continue;
		}
		// Real tool failures usually mention error=true / tool_end / tool name + fail
		if (/\berror\s*=\s*true\b/i.test(body) || /\btool_(?:end|error)\b/i.test(body)) continue;
		if (/\b(?:re_\w+|bash|read|write)\b[^\n]{0,40}\b(?:failed|error|crash)\b/i.test(body)) continue;
		// Mislabel: target gap / merged closeout / non-tool narrative
		if (
			/\bmissing (?:target|apk|path|package|binary|asset|url|file)\b/i.test(body) ||
			/\bno (?:target|apk|path|binary|file)\b/i.test(body) ||
			/\bbut runtime capture\b/i.test(body) ||
			/\bbind_ready\s*=\s*true\b/i.test(body) ||
			/\bPROOF\s*:/i.test(body) ||
			/^与\s*PROOF\b/i.test(body) ||
			/缺少(?:目标|路径|APK|包名|文件)/.test(body) ||
			/目标(?:缺失|不存在|未提供)/.test(body) ||
			(body.length > 40 && !/\berror\b/i.test(body) && !/\bfail(?:ed|ure)?\b/i.test(body))
		) {
			return { kind: "harness_mislabel", snippet: body.slice(0, 160) };
		}
	}
	return undefined;
}
