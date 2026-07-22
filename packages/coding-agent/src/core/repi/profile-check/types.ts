/** Profile-check types. */
export type ProfileCheckDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};

export type ProfileCheckMode = "quick" | "full" | "install";

export type ProfileCheckStatus = "pass" | "warn" | "fail";

export type ProfileCheckRow = {
	id: string;
	status: ProfileCheckStatus;
	evidence: string[];
	next?: string[];
};

export type ProfileCheckArtifact = {
	timestamp: string;
	mode: ProfileCheckMode;
	verdict: ProfileCheckStatus;
	checks: ProfileCheckRow[];
	capabilityMatrix: string[];
	installReadiness: string[];
	regressionGuards: string[];
	reverseCapabilityGuards: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
