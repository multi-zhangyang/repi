/** Runtime adapter execution gate format + reverse next. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { RuntimeAdapterExecutionCheckV1 } from "./types.ts";

export function formatRuntimeAdapterExecutionGate(report: RuntimeAdapterExecutionCheckV1, path?: string): string {
	const reverseOpen =
		!report.closure.allHaveProofExitSignals || report.adapters.some((a: any) => a.status === "blocked");
	const reverseNext = reverseOpen
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `runtime_adapter_gate ${report.adapters.map((a: any) => a.adapterId).join(" ")}`,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return [
		"runtime_adapter_execution:",
		"RuntimeAdapterExecutionCheckV1: true",
		"runtime: runtime:adapter-execution",
		path ? `artifact: ${path}` : undefined,
		`tool_index: ${report.toolIndexPath}`,
		report.targetProfile
			? `target_profile: kinds=${report.targetProfile.targetKinds.join(",")} adapters=${report.targetProfile.adapterIds.join(",") || "<none>"} magic=${report.targetProfile.magic ?? "<none>"} reasons=${report.targetProfile.reasons.join(" | ") || "<none>"}`
			: undefined,
		`closure: specs=${report.closure.allAdapterSpecsPresent} runner=${report.closure.allHaveRunnerTemplates} parser=${report.closure.allHaveParserRules} artifact=${report.closure.allHaveArtifactKinds} ingest=${report.closure.allHaveIngestTargets} proof=${report.closure.allHaveProofExitSignals} fallback=${report.closure.allHaveNativeOrFallbackTool} env_ref=${report.closure.allEnvRefsSecretFree}`,
		"adapters:",
		...report.adapters.flatMap((adapter: any) => [
			`- adapter:${adapter.adapterId} bridge=${adapter.bridgeId} domain=${adapter.domainId} status=${adapter.status}`,
			`  runner_kind: ${adapter.runnerKind} tool=${adapter.tool} present=${adapter.present} fallback=${adapter.fallbackTool} fallback_present=${adapter.fallbackPresent}`,
			`  command_template: ${adapter.commandTemplate}`,
			`  fallback_template: ${adapter.fallbackCommandTemplate}`,
			`  parser_rules: ${adapter.parserRules.map((rule: any) => rule.id).join(", ")}`,
			`  artifact_kinds: ${adapter.artifactKinds.join(", ")}`,
			`  ingest_targets: ${adapter.ingestTargets.join(", ")}`,
			`  proof_exit_signals: ${adapter.proofExitSignals.join("; ")}`,
			`  env_refs: ${adapter.envRefs.join(", ")}`,
			`  next: ${adapter.nextRuntimeCommands.join(" | ")}`,
		]),
		"next_runtime_commands:",
		...report.nextRuntimeCommands.map((item: any) => `- ${item}`),
		...(reverseNext.length ? ["reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)] : []),
	]
		.filter(Boolean)
		.join("\n");
}
