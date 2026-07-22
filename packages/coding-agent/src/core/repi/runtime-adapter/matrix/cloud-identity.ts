/**
 * Runtime adapter execution matrix: cloud/identity.
 */

import { cloudIdentityHostCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_CLOUD_IDENTITY_SPECS: RuntimeAdapterExecutionSpec[] = [
	{
		id: "cloud-identity-host-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "cloud-identity",
		tool: "python3",
		fallbackTool: "kubectl",
		runnerKind: "shell-command",
		commandTemplate: cloudIdentityHostCommandTemplate("native"),
		fallbackCommandTemplate: cloudIdentityHostCommandTemplate("fallback"),
		parserRules: [
			{
				id: "parser-cloud-identity",
				regex: "([cloud-identity]|KUBECONFIG|AWS_|serviceaccount)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "identity material map",
			},
			{
				id: "parser-cloud-runtime",
				regex: "([cloud-runtime-config]|[cloud-metadata]|imds)",
				evidenceRank: "process_config",
				proofExitSignal: "runtime/metadata surface",
			},
			{
				id: "parser-cloud-priv",
				regex: "([cloud-privilege-edge]|[ad-graph-edge]|RoleBinding|GenericAll)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "privilege edge",
			},
			{
				id: "parser-cloud-proof",
				regex: "([cloud-proof-capture]|proof.exit=)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "proof.exit=partial_runtime_capture",
			},
		],
		artifactKinds: ["cloud-identity", "cloud-runtime", "cloud-privilege"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: [
			"REPI_RUNTIME_ADAPTER_WORKDIR",
			"REPI_RUNTIME_ADAPTER_TIMEOUT_MS",
			"KUBECONFIG",
			"AWS_PROFILE",
			"DOMAIN",
		],
		proofExitSignals: [
			"identity material map",
			"runtime/metadata surface",
			"privilege edge",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
