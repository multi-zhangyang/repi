/** Reverse install surface shared types. */
import type { ExtensionAPI } from "../../../extensions/types.ts";

export type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;
export type CommandRegistrar = (name: string, command: Parameters<ExtensionAPI["registerCommand"]>[1]) => void;

export type ReverseRuntimeToolDeps = {
	buildDomainProofExitClosure: (...args: any[]) => any;
	buildDomainProofExitClosureOutput: (...args: any[]) => any;
	buildExploitLabOutput: (...args: any[]) => any;
	buildJsSigningOutput: (...args: any[]) => any;
	buildLiveBrowserOutput: (...args: any[]) => any;
	buildMobileRuntimeOutput: (...args: any[]) => any;
	buildNativeRuntimeOutput: (...args: any[]) => any;
	buildProfessionalRuntimeBridgesGate: (...args: any[]) => any;
	buildRuntimeAdapterExecutionGate: (...args: any[]) => any;
	buildToolchainDomainCapability: (...args: any[]) => any;
	buildToolchainDomainCapabilityOutput: (...args: any[]) => any;
	buildWebAuthzStateOutput: (...args: any[]) => any;
	formatDomainProofExitClosure: (...args: any[]) => any;
	formatProfessionalRuntimeBridgesGate: (...args: any[]) => any;
	formatRuntimeAdapterExecutionGate: (...args: any[]) => any;
	formatToolchainDomainCapability: (...args: any[]) => any;
	latestExploitLabArtifactPath: (...args: any[]) => any;
	latestJsSigningArtifactPath: (...args: any[]) => any;
	latestLiveBrowserArtifactPath: (...args: any[]) => any;
	latestMobileRuntimeArtifactPath: (...args: any[]) => any;
	latestNativeRuntimeArtifactPath: (...args: any[]) => any;
	latestWebAuthzStateArtifactPath: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	refreshToolIndex: (...args: any[]) => any;
	runExploitLab: (...args: any[]) => any;
	runJsSigning: (...args: any[]) => any;
	runLiveBrowser: (...args: any[]) => any;
	runMobileRuntime: (...args: any[]) => any;
	runNativeRuntime: (...args: any[]) => any;
	runRuntimeAdapterExecution: (...args: any[]) => any;
	runWebAuthzState: (...args: any[]) => any;
	sendDisplayMessage: (...args: any[]) => any;
	truncateMiddle: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeDomainProofExitClosureArtifact: (...args: any[]) => any;
	writeProfessionalRuntimeBridgesArtifact: (...args: any[]) => any;
	writeRuntimeAdapterExecutionArtifact: (...args: any[]) => any;
	writeToolchainDomainCapabilityArtifact: (...args: any[]) => any;
};
