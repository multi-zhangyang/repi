/** Campaign-runtime types. */
export type {
	CampaignArtifact,
	CampaignPhase,
} from "../domain-proof-exit/types.ts";

export type CampaignRuntimeDeps = {
	[key: string]: any;
	appendEvidence: (...args: any[]) => any;
	buildAttackGraph: (...args: any[]) => any;
	createBootstrapPlan: (...args: any[]) => any;
	inferTargetFromMap: (...args: any[]) => any;
	latestPassiveMapContext: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	recommendedToolsForRoute: (...args: any[]) => any;
	routeReconTask: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeAttackGraphArtifact: (...args: any[]) => any;
	readCurrentMission?: (...args: any[]) => any;
	writeCurrentMission?: (...args: any[]) => any;
	createMission?: (...args: any[]) => any;

	campaignEvidenceGaps?: (...args: any[]) => any;
	campaignPivotCandidates?: (...args: any[]) => any;
	latestOrBuildCampaign?: (...args: any[]) => any;
	operationCommandConcrete?: (...args: any[]) => any;
};
