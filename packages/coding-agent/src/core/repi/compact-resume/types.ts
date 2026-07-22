import type { AutonomousExecutionBudget } from "../operator-format-types.ts";
import type { ReconCompactionResumeCommandStatus } from "../runtime-types/compaction.ts";

/** Compact-resume types. */
export type CompactResumeDeps = {
	readCurrentMission?: (...args: any[]) => any;
	appendCompactResumeTransition: (...args: any[]) => any;
	buildCompactResumeLedgerV2Report: (...args: any[]) => any;
	caseMemoryLanePlanLines: (...args: any[]) => any;
	compactResumeAttemptForKey: (...args: any[]) => any;
	compactionResumeTelemetryPath: (...args: any[]) => any;
	contextBranchId: (...args: any[]) => any;
	contextPackSha256: (...args: any[]) => any;
	hashFileSha256: (...args: any[]) => any;
	interestingLines: (...args: any[]) => any;
	normalizeReconCommand: (...args: any[]) => any;
	readCompactResumeTransitions: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};

export type ReconCompactionAutoResume = {
	kind: "repi-compaction-auto-resume";
	version: number;
	timestamp: string;
	triggered: boolean;
	reason: string;
	compactionEntryId?: string;
	contextPath?: string;
	resumeCommands: string[];
	contractVerified: boolean;
};

export type ReconCompactionDetails = {
	kind: "repi-compaction";
	version: number;
	contextPath: string;
	missionId?: string;
	route?: string;
	target?: string;
	activeLane?: string;
	nextCommands: string[];
	sourceArtifacts: string[];
	autonomousBudget: AutonomousExecutionBudget;
	checkpointEntryType: "repi-compaction-checkpoint";
	resumeCommand: string;
};

export type ReconCompactionResumeContract = {
	kind: "repi-compaction-resume-contract";
	version: number;
	timestamp: string;
	fromExtension: boolean;
	verified: boolean;
	compactionEntryId?: string;
	firstKeptEntryId: string;
	tokensBefore: number;
	compactionKind: string;
	contextPath?: string;
	resumeCommand: string;
	nextCommands: string[];
	sourceArtifacts: string[];
	autonomousBudget?: AutonomousExecutionBudget;
	resumeContract: string[];
	verification: string[];
	summaryHead: string;
};

export type ReconCompactionResumeTelemetry = {
	kind: "repi-compaction-resume-telemetry";
	version: number;
	timestamp: string;
	compactionEntryId?: string;
	contextPath?: string;
	contractVerified: boolean;
	autoResumeTriggered: boolean;
	commandStatus: ReconCompactionResumeCommandStatus[];
	checkStatus: string[];
	proofLoopEntered: boolean;
	sourceArtifacts: string[];
};
