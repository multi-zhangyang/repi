/** Operator next-actions with reverse domain capture front-load. */

import type { OperatorFormatView } from "./operator-format-types.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function formatOperatorNextActions(operator: OperatorFormatView): string[] {
	const base = operator.nextActions.length ? operator.nextActions : ["re_complete audit"];
	const blob = [
		operator.route ?? "",
		operator.target ?? "",
		...base,
		...(operator.escalationQueue ?? []),
		JSON.stringify(operator.commanderPolicy ?? []),
	].join("\n");
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|frida/i.test(
			blob,
		);
	if (!reverseHeavy) return base.map((item: any) => `- ${item}`);
	const domainNext = reverseDomainCaptureNextCommands({
		routeOrBlob: blob,
		target: operator.target,
	}).slice(0, 4);
	return Array.from(new Set([...base, ...domainNext])).map((item: any) => `- ${item}`);
}
