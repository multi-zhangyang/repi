/** Pwn specialist evidence: followups + reverse domain next. */
import type { PwnEvidenceMeta } from "./pwn-findings.ts";
import { appendPwnBasicFollowups } from "./pwn-followups-basic.ts";
import { appendPwnReverseFollowups } from "./pwn-followups-reverse.ts";

export function appendPwnPrimitiveFollowups(meta: PwnEvidenceMeta): {
	followups: any[];
	nextLane?: string;
} {
	const followups = appendPwnBasicFollowups(meta);
	const reverse = appendPwnReverseFollowups(meta);
	return {
		followups: [...followups, ...reverse.followups],
		nextLane: reverse.nextLane,
	};
}
