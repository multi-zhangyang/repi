/** Runtime adapter matrix: native tool specs. */

import { nativeMitigationShellSnippet, nativeXrefFallbackCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_R2_SPEC: RuntimeAdapterExecutionSpec = {
	id: "r2-native-xref-adapter",
	bridgeId: "tool-bridge-runtime",
	domainId: "rev-native",
	tool: "r2",
	fallbackTool: "objdump",
	runnerKind: "shell-command",
	commandTemplate:
		"adapter-r2-native-xref-runner: target=<target>; r2 -A -q -c 'iI; afl; izz; axt @@ sym.main' \"$target\"; " +
		nativeMitigationShellSnippet(),
	fallbackCommandTemplate: nativeXrefFallbackCommandTemplate(),
	parserRules: [
		{
			id: "parser-r2-symbol-import-xref",
			regex: "(sym\\.|imp\\.|xref|axt|CALL|JMP)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "symbol/import map",
		},
		{
			id: "parser-native-entrypoint",
			regex: "(entry|start|main|Entry point)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "control-flow xref",
		},
		{
			id: "parser-native-strings",
			regex: "(password|license|token|flag|secret|strcmp|memcmp)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "runtime adapter transcript",
		},
		{
			id: "parser-native-mitigation-map",
			regex: "(\\[native-mitigation\\]|RELRO|GNU_RELRO|BIND_NOW|GNU_STACK|NX|PIE|canary|fortify)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "binary mitigation map",
		},
	],
	artifactKinds: ["native-xref-json", "native-symbol-map", "binary-mitigation-map", "runtime-adapter-transcript"],
	ingestTargets: ["evidence-ledger", "knowledge-graph", "memory-event"],
	envRefs: ["REPI_RUNTIME_ADAPTER_TIMEOUT_MS", "REPI_RUNTIME_ADAPTER_WORKDIR"],
	proofExitSignals: ["symbol/import map", "control-flow xref", "runtime adapter transcript", "binary mitigation map"],
};
