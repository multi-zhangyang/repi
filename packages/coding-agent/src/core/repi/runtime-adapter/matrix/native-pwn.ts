/** Runtime adapter matrix: native pwn/verifier. */

import { nativeMitigationShellSnippet } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";
import { buildPwntoolsLocalVerifierCommandTemplate } from "./native-pwn-template.ts";

export const RUNTIME_ADAPTER_NATIVE_PWN_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "pwntools-local-verifier-adapter",
		bridgeId: "exploit-verifier-runtime",
		domainId: "pwn",
		tool: "python3",
		fallbackTool: "gdb",
		runnerKind: "python-harness",
		commandTemplate: buildPwntoolsLocalVerifierCommandTemplate(),
		fallbackCommandTemplate:
			'adapter-pwntools-local-verifier-runner-fallback: target=<target>; file "$target" 2>/dev/null || true; ' +
			nativeMitigationShellSnippet("pwn-mitigation") +
			" checksec --file=\"$target\" 2>/dev/null || true; gdb -q \"$target\" -ex 'set pagination off' -ex 'info files' -ex quit 2>/dev/null | head -220 || true",
		parserRules: [
			{
				id: "parser-pwn-crash-offset",
				regex: "(pwn-crash-observed|cyclic|offset=|SIGSEGV|SIGABRT|SIGILL|signal=SIG)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "crash-to-offset proof",
			},
			{
				id: "parser-pwn-leak-primitive",
				regex: "(pwn-primitive-candidate|leak|primitive|control|canary|libc|system|execve|puts|printf|gets|strcpy|read|write)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "primitive control evidence",
			},
			{
				id: "parser-pwn-multirun-success",
				regex: "(pwn-multirun-summary|pwn-exec-run|runs=)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "multi-run verifier",
			},
			{
				id: "parser-pwn-stdout-stderr-hash",
				regex: "(stdout_sha256|stderr_sha256)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "stdout/stderr hash",
			},
			{
				id: "parser-pwn-mitigation-map",
				regex: "(\\[pwn-mitigation\\]|RELRO|GNU_RELRO|BIND_NOW|GNU_STACK|NX|PIE|canary|fortify)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "binary mitigation map",
			},
			{
				id: "parser-pwn-one-gadget-seccomp",
				regex: "(\\[one_gadget\\]|\\[seccomp\\]|one_gadget|seccomp-tools|SECCOMP|syscall filter|seccomp)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "one_gadget constraint review",
			},
		],
		artifactKinds: [
			"pwn-verifier-matrix",
			"stdout-stderr-hashes",
			"binary-mitigation-map",
			"runtime-adapter-transcript",
		],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_EXPLOIT_VERIFY_RUNS", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"crash-to-offset proof",
			"primitive control evidence",
			"multi-run verifier",
			"stdout/stderr hash",
			"binary mitigation map",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
