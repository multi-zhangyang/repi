/** Runtime adapter execution check/artifact types. */
import type { RuntimeAdapterExecutionRowV1, RuntimeAdapterParserRuleV1 } from "./types-base.ts";
import type { RuntimeAdapterParserSignalSummaryV1, RuntimeAdapterTargetProfileV1 } from "./types-target.ts";

export type RuntimeAdapterExecutionCheckV1 = {
	kind: "RuntimeAdapterExecutionCheckV1";
	schemaVersion: 1;
	generatedAt: string;
	RuntimeAdapterExecutionCheckV1: true;
	runtime: "runtime:adapter-execution";
	toolIndexPath: string;
	requiredChecks: string[];
	targetProfile?: RuntimeAdapterTargetProfileV1;
	adapters: RuntimeAdapterExecutionRowV1[];
	closure: {
		allAdapterSpecsPresent: boolean;
		allHaveRunnerTemplates: boolean;
		allHaveParserRules: boolean;
		allHaveArtifactKinds: boolean;
		allHaveIngestTargets: boolean;
		allHaveProofExitSignals: boolean;
		allHaveNativeOrFallbackTool: boolean;
		allEnvRefsSecretFree: boolean;
	};
	nextRuntimeCommands: string[];
	invariants: string[];
};

export type RuntimeAdapterExecutionArtifactV1 = {
	kind: "RuntimeAdapterExecutionArtifactV1";
	schemaVersion: 1;
	adapterId: string;
	domainId: string;
	bridgeId: string;
	target?: string;
	targetProfile?: RuntimeAdapterTargetProfileV1;
	startedAt: string;
	finishedAt: string;
	selectedRunner: "native" | "fallback";
	command: string;
	exitCode: number | null;
	killed: boolean;
	stdoutSha256: string;
	stderrSha256: string;
	parserSignals: Array<{
		ruleId: string;
		evidenceRank: RuntimeAdapterParserRuleV1["evidenceRank"];
		proofExitSignal: string;
		matches: string[];
	}>;
	parserSignalSummary?: RuntimeAdapterParserSignalSummaryV1;
	artifactKinds: string[];
	ingestTargets: string[];
	proofExitSignals: string[];
};
