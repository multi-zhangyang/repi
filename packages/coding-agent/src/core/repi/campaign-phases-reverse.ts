/** Seed reverse domain next into reverse-heavy campaign phases. */
import type { CampaignPhase } from "./domain-proof-exit.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function enrichCampaignPhasesReverse(
	phases: Array<CampaignPhase | undefined>,
	taskText: string,
	targetRef: string,
): CampaignPhase[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			taskText,
		);
	if (!reverseHeavy) return phases.filter(Boolean) as CampaignPhase[];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: taskText,
		target: targetRef === "<target>" ? undefined : targetRef,
		includeGates: true,
	}).slice(0, 3);
	for (const phase of phases) {
		if (!phase) continue;
		if (/native|pwn|exploit|mobile|binary|reverse|proof|runtime/i.test(`${phase.name} ${phase.objective}`)) {
			phase.nextActions = Array.from(new Set([...(phase.nextActions ?? []), ...reverseNext])).slice(0, 12);
		}
	}
	return phases.filter(Boolean) as CampaignPhase[];
}
