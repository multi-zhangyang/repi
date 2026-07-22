import type { AutonomousExecutionBudget } from "../operator-format-types.ts";

/** Runtime types: compaction. */

export type ReconCompactionEventView = {
	preparation: {
		firstKeptEntryId: string;
		tokensBefore: number;
		previousSummary?: string;
		messagesToSummarize?: unknown[];
		turnPrefixMessages?: unknown[];
		isSplitTurn?: boolean;
	};
	branchEntries?: unknown[];
	customInstructions?: string;
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

export type ReconCompactionEntryView = {
	id?: string;
	summary: string;
	firstKeptEntryId: string;
	tokensBefore: number;
	details?: unknown;
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

export type ReconCompactionResumeCommandStatus = {
	command: string;
	status: "queued" | "done" | "blocked";
	enteredProofLoop: boolean;
	outputSha256?: string;
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
