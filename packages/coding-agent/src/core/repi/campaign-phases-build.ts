/** Build campaign phases. */

import { buildCampaignDomainPhases } from "./campaign-phases-domain.ts";
import { enrichCampaignPhasesReverse } from "./campaign-phases-reverse.ts";
import { buildCampaignReverseHeavyPhases } from "./campaign-phases-reverse-heavy.ts";
import type { CampaignPhase } from "./domain-proof-exit/types.ts";
import type { MissionState } from "./mission.ts";
import type { PassiveMapContext } from "./passive-map.ts";

export function buildCampaignPhases(
	mission: MissionState | undefined,
	map: PassiveMapContext | undefined,
	target: string | undefined,
	toolGaps: string[],
	sourceArtifacts: string[],
): CampaignPhase[] {
	const taskText = [mission?.task, mission?.route.domain, target, map?.target, ...(map?.signals ?? [])].join("\n");
	const targetRef = target ?? map?.target ?? "<target>";
	const phases = [
		...buildCampaignDomainPhases(mission, map, targetRef, taskText, toolGaps, sourceArtifacts),
		...buildCampaignReverseHeavyPhases(mission, map, targetRef, taskText, toolGaps, sourceArtifacts),
	].filter((phase): phase is CampaignPhase => Boolean(phase));
	return enrichCampaignPhasesReverse(phases, taskText, targetRef);
}
