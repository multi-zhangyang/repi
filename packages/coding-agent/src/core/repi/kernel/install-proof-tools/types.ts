/** Proof-loop tool registration types. */
import type { ExtensionAPI } from "../../../extensions/types.ts";

export type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;
export type CommandRegistrar = (name: string, options: Parameters<ExtensionAPI["registerCommand"]>[1]) => void;

export type ProofLoopToolDeps = {
	buildVerifierOutput: (...args: any[]) => string;
	latestVerifierArtifactPath: () => string | undefined;
	buildCompilerOutput: (...args: any[]) => string;
	latestCompilerArtifactPath: () => string | undefined;
	buildReplayerOutput: (...args: any[]) => string;
	latestReplayerArtifactPath: () => string | undefined;
	runReplayer: (...args: any[]) => any;
	buildAutofixOutput: (...args: any[]) => string;
	latestAutofixArtifactPath: () => string | undefined;
	buildProofLoopOutput: (...args: any[]) => string;
	latestProofLoopArtifactPath: () => string | undefined;
	runProofLoop: (...args: any[]) => any;
	createBootstrapPlan: (...args: any[]) => any[];
	formatBootstrapPlan: (...args: any[]) => string;
	installBootstrapTools: (...args: any[]) => any;
	appendCompletionMemoryEvent: (...args: any[]) => any;
	auditCompletion: (...args: any[]) => any;
	formatCompletionAudit: (...args: any[]) => string;
	formatCompletionAuditFromAudit: (...args: any[]) => string;
	writeReportScaffold: (...args: any[]) => any;
	buildToolDigest: () => string;
	refreshToolIndex: (...args: any[]) => any;
	toolIndexPath: () => string;
	truncateMiddle: (text: string, max: number) => string;
	updateMissionCheckpoint: (...args: any[]) => any;
	buildProfileCheckOutput: (...args: any[]) => string;
	latestProfileCheckArtifactPath: () => string | undefined;
	sendDisplayMessage: (pi: ExtensionAPI, title: string, text: string) => void;
};
