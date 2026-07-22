import type { StrictClaimCheckSnapshot, StructuredClaimMergeCheckSnapshot } from "../runtime-types/claim.ts";

export type { StrictClaimCheckSnapshot, StructuredClaimMergeCheckSnapshot } from "../runtime-types/claim.ts";

import type { VerifierStatus } from "../runtime-types/verifier-replay.ts";

/** Compiler-runtime types. */
export type CompilerArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "draft" | "final";
	verifierArtifact?: string;
	operatorFeedback: string[];
	statusSummary: Record<VerifierStatus, number>;
	outcome: string[];
	keyEvidence: string[];
	reproCommands: string[];
	contradictions: string[];
	gaps: string[];
	nextOperatorQueue: string[];
	finalReport: string[];
	reportPath?: string;
	supervisorArtifact?: string;
	releaseCheckMetadata: string[];
	claimCheckPolicy: string[];
	strictClaimCheck?: StrictClaimCheckSnapshot;
	claimCheckResult: string[];
	structuredClaimMergeCheck?: StructuredClaimMergeCheckSnapshot;
	sourceArtifacts: string[];
};

export type CompilerRuntimeDeps = {
	[key: string]: any;
	appendEvidence: (...args: any[]) => any;
	evidenceLedgerPath: (...args: any[]) => any;
	operatorFeedbackNextCommands: (...args: any[]) => any;
	reportDir: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;

	formatStrictClaimCheckSnapshot?: (...args: any[]) => any;
};

const _compilerRuntimeDeps: CompilerRuntimeDeps | null = null;
