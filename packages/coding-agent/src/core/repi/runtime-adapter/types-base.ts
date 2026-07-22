/** Runtime adapter base/spec types. */
export type RuntimeAdapterStatus = "native-ready" | "fallback-ready" | "blocked";
export type RuntimeAdapterRunnerKind = "shell-command" | "cdp-capture" | "frida-hook" | "python-harness";
export type RuntimeAdapterTargetKind =
	| "web-url"
	| "cdp-endpoint"
	| "native-binary"
	| "pwn-binary"
	| "mobile-package"
	| "pcap-flow"
	| "firmware-image"
	| "firmware-rootfs"
	| "unknown";

export type RuntimeAdapterParserRuleV1 = {
	id: string;
	regex: string;
	evidenceRank: "runtime_artifact" | "network" | "served_asset" | "process_config";
	proofExitSignal: string;
};

export type RuntimeAdapterExecutionSpec = {
	id: string;
	bridgeId: string;
	domainId: string;
	tool: string;
	fallbackTool: string;
	runnerKind: RuntimeAdapterRunnerKind;
	commandTemplate: string;
	fallbackCommandTemplate: string;
	parserRules: RuntimeAdapterParserRuleV1[];
	artifactKinds: string[];
	ingestTargets: string[];
	envRefs: string[];
	proofExitSignals: string[];
};

export type RuntimeAdapterExecutionRowV1 = RuntimeAdapterExecutionSpec & {
	adapterId: string;
	present: boolean;
	fallbackPresent: boolean;
	status: RuntimeAdapterStatus;
	runnerReady: boolean;
	parserReady: boolean;
	artifactIngestReady: boolean;
	proofExitReady: boolean;
	envRefOnly: boolean;
	nextRuntimeCommands: string[];
};
