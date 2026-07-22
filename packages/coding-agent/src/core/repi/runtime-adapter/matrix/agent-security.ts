/**
 * Runtime adapter execution matrix: agent-security.
 */

import { agentSecurityBoundaryCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_AGENT_SECURITY_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "agent-security-boundary-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "agent-security",
		tool: "rg",
		fallbackTool: "python3",
		runnerKind: "shell-command",
		commandTemplate: agentSecurityBoundaryCommandTemplate("native"),
		fallbackCommandTemplate: agentSecurityBoundaryCommandTemplate("fallback"),
		parserRules: [
			{
				id: "parser-agent-prompt",
				regex: "([agent-prompt]|[agent-prompt-risk]|systemPrompt|prompt injection)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "prompt surface",
			},
			{
				id: "parser-agent-tool",
				regex: "([agent-tool]|[agent-tool-risk]|registerTool|schema)",
				evidenceRank: "process_config",
				proofExitSignal: "tool boundary",
			},
			{
				id: "parser-agent-memory-inject",
				regex: "([agent-memory]|[agent-injection|[agent-delegation)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "memory/injection proof",
			},
			{
				id: "parser-agent-proof",
				regex: "([agent-security-proof-capture]|proof.exit=)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "proof.exit=partial_runtime_capture",
			},
		],
		artifactKinds: ["agent-prompt", "agent-tool", "agent-memory"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_RUNTIME_ADAPTER_WORKDIR", "REPI_RUNTIME_ADAPTER_TIMEOUT_MS"],
		proofExitSignals: [
			"prompt surface",
			"tool boundary",
			"memory/injection proof",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
