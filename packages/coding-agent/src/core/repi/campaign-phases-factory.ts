/** Campaign phase factory helpers. */

import { matchingLaneNames, phaseDoneFromLanes } from "./campaign-phases-helpers.ts";
import type { CampaignPhase, CampaignPhaseStatus } from "./domain-proof-exit/types.ts";
import type { MissionState } from "./mission.ts";

export function createCampaignPhaseFactory(
	mission: MissionState | undefined,
	map: any,
	toolGaps: string[],
	sourceArtifacts: string[],
) {
	return (
		name: string,
		objective: string,
		route: string,
		relevant: boolean,
		requiredEvidence: string[],
		lanePatterns: RegExp[],
		nextActions: string[],
		phaseToolGaps: string[] = toolGaps,
	): CampaignPhase | undefined => {
		if (!mission && name !== "recon-map") return undefined;
		if (!relevant && name !== "report-audit") return undefined;
		const candidateLanes = matchingLaneNames(mission, lanePatterns);
		const status: CampaignPhaseStatus = !mission
			? "blocked"
			: name === "recon-map" && map
				? "done"
				: phaseDoneFromLanes(mission, candidateLanes)
					? "done"
					: relevant
						? "ready"
						: "pending";
		return {
			name,
			objective,
			route,
			status,
			requiredEvidence,
			candidateLanes,
			nextActions,
			toolGaps: phaseToolGaps.slice(0, 10),
			sourceArtifacts: sourceArtifacts.slice(0, 10),
		};
	};
}
