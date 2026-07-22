/**
 * Runtime adapter execution matrix: memory-forensics.
 */

import { memoryForensicsHostCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_MEMORY_FORENSICS_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "memory-forensics-host-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "memory-forensics",
		tool: "volatility3",
		fallbackTool: "strings",
		runnerKind: "shell-command",
		commandTemplate: memoryForensicsHostCommandTemplate("native"),
		fallbackCommandTemplate: memoryForensicsHostCommandTemplate("fallback"),
		parserRules: [
			{
				id: "parser-mem-image",
				regex: "([mem-image]|sample_sha256|profile_hint)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "image profile",
			},
			{
				id: "parser-mem-process",
				regex: "([mem-process]|[mem-vol]|[mem-pslist]|[mem-netscan])",
				evidenceRank: "process_config",
				proofExitSignal: "process/network map",
			},
			{
				id: "parser-mem-cred",
				regex: "([mem-credential]|[mem-vol-credential]|AWS_ACCESS_KEY|Authorization:)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "credential/artifact proof",
			},
			{
				id: "parser-mem-proof",
				regex: "([memory-proof-capture]|proof.exit=)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "proof.exit=partial_runtime_capture",
			},
		],
		artifactKinds: ["mem-image", "mem-process", "mem-credential"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_RUNTIME_ADAPTER_WORKDIR", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"image profile",
			"process/network map",
			"credential/artifact proof",
			"timeline/carve evidence",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
