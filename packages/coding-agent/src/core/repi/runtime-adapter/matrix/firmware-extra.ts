/**
 * Runtime adapter matrix: firmware extra (rootfs service map).
 */

import { rootfsServiceMapCommandTemplate } from "../command-templates.ts";
import type { RuntimeAdapterExecutionSpec } from "../types.ts";

export const RUNTIME_ADAPTER_FIRMWARE_SPECS_EXTRA: RuntimeAdapterExecutionSpec[] = [
	{
		id: "firmware-rootfs-service-map-adapter",
		bridgeId: "tool-bridge-runtime",
		domainId: "firmware-iot",
		tool: "find",
		fallbackTool: "grep",
		runnerKind: "shell-command",
		commandTemplate: rootfsServiceMapCommandTemplate("native"),
		fallbackCommandTemplate: rootfsServiceMapCommandTemplate("fallback"),
		parserRules: [
			{
				id: "parser-rootfs-passwd",
				regex: "(\\[rootfs-account\\]|root:|/etc/passwd|passwd|shadow)",
				evidenceRank: "runtime_artifact",
				proofExitSignal: "account database proof",
			},
			{
				id: "parser-rootfs-service-init",
				regex: "(\\[rootfs-service\\]|\\[rootfs-binary\\]|init\\.d|rc\\.d|systemd|httpd|dropbear|telnet|busybox)",
				evidenceRank: "process_config",
				proofExitSignal: "rootfs service map",
			},
			{
				id: "parser-rootfs-config-secret",
				regex: "(\\[rootfs-config-secret\\]|uci|config|password|token|key|credential|secret)",
				evidenceRank: "process_config",
				proofExitSignal: "credential/config proof",
			},
		],
		artifactKinds: ["rootfs-service-map", "rootfs-config-credential-scan", "runtime-adapter-transcript"],
		ingestTargets: ["evidence-ledger", "knowledge-graph"],
		envRefs: ["REPI_RUNTIME_ADAPTER_TIMEOUT_MS", "REPI_RUNTIME_ADAPTER_WORKDIR"],
		proofExitSignals: [
			"account database proof",
			"rootfs service map",
			"credential/config proof",
			"proof.exit=partial_runtime_capture",
			"proof.exit=runtime_capture_strong",
			"bind_ready=true",
		],
	},
];
