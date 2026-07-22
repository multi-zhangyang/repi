import type { VerifierAssertion } from "../runtime-types/verifier-replay.ts";

export type { VerifierAssertion } from "../runtime-types/verifier-replay.ts";

/** Verifier-runtime types. */
export type VerifierArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "check" | "matrix";
	operatorArtifact?: string;
	operatorFeedback: string[];
	assertions: VerifierAssertion[];
	contradictions: string[];
	gaps: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type VerifierRuntimeDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};

const _verifierRuntimeDeps: VerifierRuntimeDeps | null = null;
