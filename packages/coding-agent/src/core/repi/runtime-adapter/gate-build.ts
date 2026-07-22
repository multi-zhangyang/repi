/** Runtime adapter execution gate builder. */
import { RUNTIME_ADAPTER_EXECUTION_MATRIX } from "./matrix.ts";
import { inspectRuntimeAdapterTarget } from "./target-inspect.ts";
import type {
	RuntimeAdapterExecutionCheckV1,
	RuntimeAdapterExecutionRowV1,
	RuntimeAdapterToolPresence,
} from "./types.ts";

export function runtimeAdapterSecretLike(value: string): boolean {
	return /(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,}|AKIA[0-9A-Z]{12,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/.test(
		value,
	);
}

export function buildRuntimeAdapterExecutionGate(
	adapterFilter: string | undefined,
	options: { toolIndexPath: string; isToolPresent: RuntimeAdapterToolPresence },
): RuntimeAdapterExecutionCheckV1 {
	const targetProfile = inspectRuntimeAdapterTarget(adapterFilter);
	const detectedAdapterIds = targetProfile.adapterIds;
	const specs = adapterFilter
		? RUNTIME_ADAPTER_EXECUTION_MATRIX.filter(
				(adapter) =>
					adapter.id === adapterFilter ||
					adapter.id.includes(adapterFilter) ||
					adapter.domainId.includes(adapterFilter) ||
					detectedAdapterIds.includes(adapter.id),
			)
		: RUNTIME_ADAPTER_EXECUTION_MATRIX;
	const adapters = specs.map<RuntimeAdapterExecutionRowV1>((adapter) => {
		const present = options.isToolPresent(adapter.tool) === true;
		const fallbackPresent = options.isToolPresent(adapter.fallbackTool) === true;
		return {
			...adapter,
			adapterId: adapter.id,
			present,
			fallbackPresent,
			status: present ? "native-ready" : fallbackPresent ? "fallback-ready" : "blocked",
			runnerReady:
				adapter.commandTemplate.includes("adapter-") && adapter.fallbackCommandTemplate.includes("fallback"),
			parserReady:
				adapter.parserRules.length >= 2 && adapter.parserRules.every((rule: any) => rule.id.startsWith("parser-")),
			artifactIngestReady:
				adapter.artifactKinds.length >= 2 &&
				adapter.ingestTargets.includes("evidence-ledger") &&
				adapter.ingestTargets.includes("knowledge-graph") &&
				adapter.ingestTargets.includes("memory-event"),
			proofExitReady: adapter.proofExitSignals.length >= 2,
			envRefOnly: adapter.envRefs.every(
				(ref: any) => /^[A-Z][A-Z0-9_]+$/.test(ref) && !runtimeAdapterSecretLike(ref),
			),
			nextRuntimeCommands: [
				`re_runtime_adapter plan ${adapter.id} <target>`,
				`re_runtime_adapter run ${adapter.id} <target>`,
				"re_verifier matrix",
				`re_domain_proof_exit write ${adapter.domainId}`,
			],
		};
	});
	return {
		kind: "RuntimeAdapterExecutionCheckV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		RuntimeAdapterExecutionCheckV1: true,
		runtime: "runtime:adapter-execution",
		toolIndexPath: options.toolIndexPath,
		targetProfile: adapterFilter ? targetProfile : undefined,
		requiredChecks: [
			"runtime_adapter_execution_check",
			"adapter_runner_parser_ingest_contract",
			"gdb_native_trace_adapter_contract",
			"r2_ghidra_native_adapter_contract",
			"frida_mobile_adapter_contract",
			"web_cdp_adapter_contract",
			"pwntools_exploit_verifier_adapter_contract",
			"tshark_pcap_adapter_contract",
			"binwalk_firmware_adapter_contract",
			"firmware_rootfs_service_map_adapter_contract",
			"target_auto_detection_contract",
			"runtime_adapter_target_profile_contract",
			"parser_signal_summary_contract",
		],
		adapters,
		closure: {
			allAdapterSpecsPresent: adapters.length === RUNTIME_ADAPTER_EXECUTION_MATRIX.length || Boolean(adapterFilter),
			allHaveRunnerTemplates: adapters.every((adapter: any) => adapter.runnerReady),
			allHaveParserRules: adapters.every((adapter: any) => adapter.parserReady),
			allHaveArtifactKinds: adapters.every((adapter: any) => adapter.artifactKinds.length >= 2),
			allHaveIngestTargets: adapters.every((adapter: any) => adapter.artifactIngestReady),
			allHaveProofExitSignals: adapters.every((adapter: any) => adapter.proofExitReady),
			allHaveNativeOrFallbackTool: adapters.every((adapter: any) => adapter.present || adapter.fallbackPresent),
			allEnvRefsSecretFree: adapters.every((adapter: any) => adapter.envRefOnly),
		},
		nextRuntimeCommands: [
			"re_runtime_adapter show",
			"re_runtime_adapter plan <target-or-url-or-pcap>",
			"re_runtime_adapter run <target>",
			"re_runtime_adapter run web-cdp-network-adapter <url>",
			"re_runtime_adapter run gdb-native-trace-adapter <binary>",
			"re_runtime_adapter run firmware-rootfs-service-map-adapter <rootfs-dir>",
			"re_runtime_adapter show",
		],
		invariants: [
			"runtime_adapter_execution_check",
			"adapter_runner_parser_ingest_contract",
			"runner_output_parser_must_write_artifact",
			"artifact_ingest_target_must_include_evidence_knowledge_memory",
			"adapter_run_secret_literals_rejected",
		],
	};
}
