/** Bash risk grading for plan/permission harness modes. */
const DESTRUCTIVE_BASH = [
	/\brm\b/i,
	/\brmdir\b/i,
	/\bmv\b/i,
	/\bcp\b(?!p)/i,
	/\bchmod\b/i,
	/\bchown\b/i,
	/\bsudo\b/i,
	/\bmkfs\b/i,
	/\bdd\b/i,
	/\bshred\b/i,
	/\breboot\b/i,
	/\bshutdown\b/i,
	// file truncating redirects handled in classifyBashRisk after fd-strip (not here)
	/\bgit\s+(push|reset\s+--hard|clean\s+-fd)/i,
	/\bcurl\b.+\|\s*(ba)?sh/i,
	/\bwget\b.+\|\s*(ba)?sh/i,
];

const SAFE_BASH = [
	/^(?:ls|ll|la|pwd|whoami|id|uname|date|cal|df|du|free|uptime|file|stat|wc|head|tail|cat|less|more|echo|printf|true|false|test|\[)\b/i,
	/^(?:rg|grep|find|fd|which|type|command|env|printenv|set|alias|history)\b/i,
	/^(?:git\s+(?:status|log|diff|show|branch|remote|rev-parse|ls-files|blame|stash\s+list))\b/i,
	/^(?:python3?|node|jq|yq|xxd|hexdump|strings|readelf|objdump|nm|checksec|r2|rabin2|radare2|gdb|tshark|capinfos|binwalk|repi)\b/i,
	/^(?:sha256sum|sha1sum|md5sum|base64|od|cmp|diff)\b/i,
	// web recon read-only probes (no shell pipe sinks)
	/^(?:curl)\b(?!.*\|\s*(?:ba)?sh)(?!.*\s-o\s)(?!.*\s--output\b)/i,
	/^(?:dig|nslookup|host|whatweb|httpx|nuclei)\b/i,
];

/** Claude Code-style bash risk levels for permission grading. */
export type BashRiskLevel = "safe" | "elevated" | "destructive";

/** High-risk but not always blocked outside plan (needs acceptEdits/bypass for default). */
const HIGH_RISK_BASH = [
	/\bcurl\b.+\|\s*(?:ba)?sh/i,
	/\bwget\b.+\|\s*(?:ba)?sh/i,
	/\bnpm\s+(?:publish|unpublish)\b/i,
	/\bpip\s+install\b/i,
	/\bapt(?:-get)?\s+install\b/i,
	/\bdocker\s+(?:system\s+prune|rmi|volume\s+rm)\b/i,
	/\bkill\b|\bkillall\b|\bpkill\b/i,
	/\biptables\b|\bufw\b/i,
	/\bnc\s+-[el]/i,
	/\bpython3?\s+-c\b.+(?:os\.system|subprocess|socket)/i,
];

/** Strip pure fd remaps so reverse probes with `2>&1 | head` are not elevated/destructive. */
export function stripSafeFdRedirects(command: string): string {
	return (
		command
			// 2>&1, 1>&2, >&2, &>/dev/null, 2>/dev/null, >/dev/null
			.replace(/(?:\d*)?&?>&\d+/g, " ")
			.replace(/(?:\d*)?>&?\/dev\/null/g, " ")
			.replace(/\d*>&\d+/g, " ")
	);
}

export function classifyBashRisk(command: string): BashRiskLevel {
	const text = command.trim();
	if (!text) return "safe";
	const forRedirect = stripSafeFdRedirects(text);
	if (DESTRUCTIVE_BASH.some((pattern: any) => pattern.test(forRedirect))) return "destructive";
	if (HIGH_RISK_BASH.some((pattern: any) => pattern.test(text))) return "elevated";
	// real file write redirects (not fd remaps) are elevated
	if (/(^|[^<\d])>(?!>)(?!&)/.test(forRedirect) || />>/.test(forRedirect)) return "elevated";
	return "safe";
}

export function isSafePlanBash(command: string): boolean {
	const text = command.trim();
	if (!text) return false;
	if (classifyBashRisk(text) === "destructive") return false;
	if (DESTRUCTIVE_BASH.some((pattern: any) => pattern.test(text))) return false;
	// Allow simple pipelines of safe commands only.
	const parts = text
		.split(/&&|\|\||;|\|/)
		.map((part: any) => part.trim())
		.filter(Boolean);
	if (parts.length === 0) return false;
	return parts.every((part: any) => SAFE_BASH.some((pattern: any) => pattern.test(part)));
}
