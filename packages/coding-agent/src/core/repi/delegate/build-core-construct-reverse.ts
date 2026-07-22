/** Delegate reverse domain next actions. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function delegateReverseNextActions(params: {
	target?: string;
	task?: string;
	mode?: string;
	gaps: string[];
	nextActions: string[];
}): string[] {
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${params.target ?? ""} ${params.task ?? ""} ${params.mode ?? ""} ${JSON.stringify(params.gaps ?? [])}`,
		target: params.target,
		includeGates: true,
	}).slice(0, 3);
	if (!reverseNext.length) return params.nextActions;
	return Array.from(new Set([...params.nextActions, ...reverseNext])).slice(0, 16);
}
