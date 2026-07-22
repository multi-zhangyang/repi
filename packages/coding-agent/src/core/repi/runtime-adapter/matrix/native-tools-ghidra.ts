/** Runtime adapter matrix: native tool specs. */

import { nativeDecompilerSummaryFallbackCommandTemplate, nativeMitigationShellSnippet } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_GHIDRA_SPEC: RuntimeAdapterExecutionSpec = {
	id: "ghidra-headless-summary-adapter",
	bridgeId: "tool-bridge-runtime",
	domainId: "rev-native",
	tool: "analyzeHeadless",
	fallbackTool: "readelf",
	runnerKind: "shell-command",
	commandTemplate:
		"adapter-ghidra-headless-summary-runner: target=<target>; analyzeHeadless " +
		"$" +
		'{REPI_GHIDRA_PROJECT_DIR:-/tmp/repi-ghidra} repi -import "$target" -overwrite -scriptPath ' +
		"$" +
		"{REPI_GHIDRA_SCRIPT_DIR:-/tmp} -postScript RepiSummary.java; " +
		nativeMitigationShellSnippet(),
	fallbackCommandTemplate: nativeDecompilerSummaryFallbackCommandTemplate(),
	parserRules: [
		{
			id: "parser-ghidra-function-summary",
			regex: "(Function|FUN_|decompile|symbol|xref)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "decompiler summary",
		},
		{
			id: "parser-native-entrypoint",
			regex: "(Entry point|start|main)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "function inventory",
		},
		{
			id: "parser-native-import-table",
			regex: "(UND|GLOBAL|GLIBC|Import|Symbol table)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "import table proof",
		},
		{
			id: "parser-native-mitigation-map",
			regex: "(\\[native-mitigation\\]|RELRO|GNU_RELRO|BIND_NOW|GNU_STACK|NX|PIE|canary|fortify)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "binary mitigation map",
		},
	],
	artifactKinds: [
		"ghidra-headless-summary",
		"native-import-table",
		"binary-mitigation-map",
		"runtime-adapter-transcript",
	],
	ingestTargets: ["evidence-ledger", "knowledge-graph", "memory-event"],
	envRefs: ["REPI_GHIDRA_PROJECT_DIR", "REPI_GHIDRA_SCRIPT_DIR", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
	proofExitSignals: ["decompiler summary", "function inventory", "import table proof", "binary mitigation map"],
};
