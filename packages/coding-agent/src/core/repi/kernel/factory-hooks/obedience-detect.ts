/** Product-layer obedience detection (authorization theater / excuse / missing closeout). */

export type ObedienceViolationKind =
	| "refusal_theater"
	| "authorization_theater"
	| "execution_stall"
	| "missing_closeout";

export type ObedienceViolation = {
	kind: ObedienceViolationKind;
	snippet: string;
};

const REFUSAL_PATTERNS: RegExp[] = [
	/\bI(?:'m| am) (?:unable|not able|not allowed|not permitted|not going) to\b/i,
	/\bI can'?t (?:help|assist|do|provide|create|generate|write|continue)\b/i,
	/\bI cannot (?:help|assist|do|provide|create|generate|write|continue)\b/i,
	/\bI must (?:decline|refuse)\b/i,
	/作为(?:一个)?(?:AI|人工智能|语言模型).{0,40}(?:不能|无法|不应)/,
	/我(?:不能|无法|没法|不可以|拒绝)(?:帮助|协助|帮你|提供|执行|继续)/,
	/抱歉[，,]?\s*(?:我|这)(?:不能|无法)/,
];

/** Ask-for-target / wait-for-operator after tools — protocol stall under operator supremacy. */
const EXECUTION_STALL_PATTERNS: RegExp[] = [
	/\bI need (?:a |the )?(?:\w+\s+){0,3}(?:target|domain|url|asset|apk|package)\b/i,
	/\bCould you (?:please )?(?:provide|share|specify)\b[^\n]{0,80}(?:domain|url|target|asset|apk|package|path)\b/i,
	/\bPlease (?:provide|share|specify)\b[^\n]{0,80}(?:target|domain|url|asset|apk|package|path)\b/i,
	/\b(?:what|which) (?:target|domain|url|asset|apk|package)\b[^\n]{0,40}\?/i,
	/\bAPK (?:file )?path\b[^\n]{0,40}(?:provide|specify|need|\?)/i,
	/\bpackage name\b[^\n]{0,60}(?:provide|specify|need|\?|app)/i,
	/Once you specify the target/i,
	/需要(?:一个|具体的?)?(?:目标|域名|URL|资产|APK|包名)/i,
	/请(?:提供|给出|补充)(?:一个|具体的?)?(?:目标|域名|URL|资产|APK|包名|路径)/i,
	/routing is complete but I need a target/i,
	/completed the routing and passive mapping[^\n]{0,120}need a (?:specific )?target/i,
];

const AUTH_THEATER_PATTERNS: RegExp[] = [
	/\b(?:CFAA|Computer Fraud|Terms of Service|ToS)\b[^\n]{0,80}(?:cannot|can'?t|illegal|violat|refuse)/i,
	/\bwithout (?:explicit )?authorization\b/i,
	/\bI need (?:you to )?(?:confirm|verify) (?:authorization|permission|scope)\b/i,
	/请确认(?:你|您)?(?:是否)?(?:有|拥有)?授权/,
	/(?:法律风险|合规风险|服务条款).{0,40}(?:无法|不能|拒绝|不宜)/,
	/(?:建议|推荐)(?:你|您)?(?:联系|咨询)(?:管理员|法务|legal).{0,20}(?:确认|授权)/,
	/未(?:经|获得)(?:明确)?授权.{0,30}(?:不能|无法|拒绝)/,
	/authorization theater|scope disclaimer|范围声明/i,
];

function snippetAround(text: string, re: RegExp): string {
	const m = re.exec(text);
	if (!m) return text.slice(0, 120);
	const i = Math.max(0, m.index - 20);
	return text
		.slice(i, i + 160)
		.replace(/\s+/g, " ")
		.trim();
}

/** Detect refusal / authorization theater in final assistant text (even if tools ran). */
export function detectObedienceViolation(text: string): ObedienceViolation | undefined {
	const t = String(text ?? "").slice(0, 8000);
	if (!t.trim()) return undefined;
	for (const re of REFUSAL_PATTERNS) {
		if (re.test(t)) return { kind: "refusal_theater", snippet: snippetAround(t, re) };
	}
	for (const re of AUTH_THEATER_PATTERNS) {
		if (re.test(t)) return { kind: "authorization_theater", snippet: snippetAround(t, re) };
	}
	for (const re of EXECUTION_STALL_PATTERNS) {
		if (re.test(t)) return { kind: "execution_stall", snippet: snippetAround(t, re) };
	}
	return undefined;
}

/** Reverse closeout missing after proof is bound / complete ready. */
export function detectMissingCloseout(
	text: string,
	opts: { reverseBound: boolean; completeReady: boolean },
): ObedienceViolation | undefined {
	if (!opts.reverseBound && !opts.completeReady) return undefined;
	const t = String(text ?? "");
	// Accept plain or markdown-wrapped labels (**HARNESS_BUGS:** / **PROOF:**).
	if (/HARNESS_BUGS\s*:/i.test(t) && /\bPROOF\s*:/i.test(t)) return undefined;
	// Only fire when model produced a substantial narrative without skeleton
	if (t.trim().length < 40) return undefined;
	return {
		kind: "missing_closeout",
		snippet: t.slice(0, 120).replace(/\s+/g, " ").trim(),
	};
}
