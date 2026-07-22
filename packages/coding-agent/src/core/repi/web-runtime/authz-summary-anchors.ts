/** Web authz anchors. */
/** Web authz anchors/format/summary with reverse proof fields. */

import { interestingLines, truncateMiddle } from "../text.ts";

export function webAuthzStateAnchors(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	return [
		...interestingLines(text, /\[web-authz-env\]/i, 8).map(
			(line) => `web authz tool readiness anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-state\]/i, 30).map(
			(line) => `web authz principal state anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-matrix\]/i, 12).map(
			(line) => `web authz matrix anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-object\]/i, 12).map(
			(line) => `web authz object ownership anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-sequence\]/i, 20).map(
			(line) => `web authz sequence replay anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-rollback\]/i, 12).map(
			(line) => `web authz rollback anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-artifact\]|\[web-authz-script\]/i, 8).map(
			(line) => `web authz artifact anchors: ${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[web-authz-blocked\]/i, 12).map(
			(line) => `web authz blocked anchors: ${truncateMiddle(line, 260)}`,
		),
	].slice(0, 120);
}
