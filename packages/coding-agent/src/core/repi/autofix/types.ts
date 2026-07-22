/** Autofix types. */
export type AutofixStatus = "queued" | "applied" | "blocked";

export type AutofixItemKind = "patch" | "command_substitution" | "bootstrap" | "evidence_recapture" | "operator";

export type AutofixItem = {
	id: string;
	kind: AutofixItemKind;
	source: string;
	reason: string;
	command: string;
	status: AutofixStatus;
	sourceArtifacts: string[];
};

export type AutofixArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "apply";
	replayArtifact?: string;
	compilerArtifact?: string;
	operatorFeedback: string[];
	failures: string[];
	patchQueue: AutofixItem[];
	commandSubstitutions: AutofixItem[];
	bootstrapQueue: AutofixItem[];
	evidenceRecaptureQueue: AutofixItem[];
	nextOperatorQueue: string[];
	applied: string[];
	repairRollbackPolicyPath?: string;
	repairRollbackPolicyStatus?: "pass" | "blocked" | "missing";
	repairRollbackPolicyErrors: string[];
	sourceArtifacts: string[];
};

/** Minimal replay shape for autofix failure extraction. */

export type AutofixReplayView = {
	target?: string;
	compilerArtifact?: string;
	sourceArtifacts: string[];
	blocked: string[];
	operatorFeedback?: string[];
	executions: Array<{
		stepId: string;
		status?: string;
		exit?: number | string;
		command?: string;
		stderrHead?: string;
	}>;
	[key: string]: unknown;
};

export type AutofixDeps = {
	[key: string]: any;
	latestCompilerArtifactPath: (...args: any[]) => any;
	parseCompilerArtifact: (...args: any[]) => any;
	operatorFeedbackNextCommands: (...args: any[]) => any;
	appendJournal: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	appendAutofixMemoryEvent: (...args: any[]) => any;
	appendRuntimeFailureRepairFromAutofix: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;

	latestOrBuildReplay?: (...args: any[]) => any;
	writeAutofixRepairRollbackPolicy?: (...args: any[]) => any;
	bootstrapToolFromCommand?: (...args: any[]) => any;
};

const _autofixDeps: AutofixDeps | null = null;
