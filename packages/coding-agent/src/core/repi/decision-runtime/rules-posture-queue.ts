/** Decision operator queue (reverse run-first). */
/** Decision-core pure rules and posture helpers. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { uniqueNonEmpty } from "../text.ts";

export function decisionOperatorQueue(rules: string[]): string[] {
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: rules.join("\n"),
		includeGates: false,
	});
	const fromRules = uniqueNonEmpty(
		rules
			.map((rule: any) => {
				const m = /(?:^|\s)(re_[a-z0-9_]+(?:\s+[^\n#]+)?)/i.exec(rule);
				return m?.[1]?.trim();
			})
			.filter((item): item is string => Boolean(item)),
		24,
	);
	// Prefer reverse run-first commands ahead of narrative plan/show.
	const preferred = reverseNext.filter((cmd: any) => /\brun\b/.test(cmd));
	return uniqueNonEmpty([...preferred, ...fromRules, ...reverseNext], 16);
}
