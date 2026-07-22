/** Runtime adapter matrix: native tool specs. */

import { nativeDebuggerFallbackCommandTemplate, nativeMitigationShellSnippet } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_GDB_SPEC: RuntimeAdapterExecutionSpec = {
	id: "gdb-native-trace-adapter",
	bridgeId: "tool-bridge-runtime",
	domainId: "rev-native",
	tool: "gdb",
	fallbackTool: "objdump",
	runnerKind: "shell-command",
	commandTemplate:
		"adapter-gdb-native-trace-runner: target=<target>; gdb -q \"$target\" -ex 'set pagination off' -ex 'set disassembly-flavor intel' -ex 'info files' -ex 'info functions' -ex 'break main' -ex 'run' -ex 'bt' -ex 'info registers' -ex 'quit'; " +
		nativeMitigationShellSnippet(),
	fallbackCommandTemplate: nativeDebuggerFallbackCommandTemplate(),
	parserRules: [
		{
			id: "parser-gdb-entry-registers",
			regex: "(Breakpoint|Program received signal|rip|eip|pc|info registers|backtrace|#0)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "debugger runtime trace",
		},
		{
			id: "parser-gdb-function-map",
			regex: "(All defined functions|main|sym\\.|Entry point|\\.text)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "function/runtime entry map",
		},
		{
			id: "parser-native-crash-signal",
			regex: "(SIGSEGV|SIGABRT|SIGILL|crash|stack|rsp|esp)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "crash/register proof",
		},
		{
			id: "parser-native-mitigation-map",
			regex: "(\\[native-mitigation\\]|RELRO|GNU_RELRO|BIND_NOW|GNU_STACK|NX|PIE|canary|fortify)",
			evidenceRank: "runtime_artifact",
			proofExitSignal: "binary mitigation map",
		},
	],
	artifactKinds: ["gdb-runtime-trace", "native-register-map", "binary-mitigation-map", "runtime-adapter-transcript"],
	ingestTargets: ["evidence-ledger", "knowledge-graph", "memory-event"],
	envRefs: ["REPI_RUNTIME_ADAPTER_TIMEOUT_MS", "REPI_RUNTIME_ADAPTER_WORKDIR"],
	proofExitSignals: [
		"debugger runtime trace",
		"function/runtime entry map",
		"crash/register proof",
		"binary mitigation map",
	],
};
