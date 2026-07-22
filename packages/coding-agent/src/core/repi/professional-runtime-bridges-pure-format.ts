/** Professional runtime bridge pure format helpers. */
import type { ProfessionalRuntimeBridgesCheckV1 } from "./professional-runtime-bridges-data.ts";

export function runtimeBridgeSecretLike(value: string): boolean {
	return /(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,}|AKIA[0-9A-Z]{12,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/.test(
		value,
	);
}

export function formatProfessionalRuntimeBridgesGate(report: ProfessionalRuntimeBridgesCheckV1, path?: string): string {
	return [
		"professional_runtime_bridges:",
		"ProfessionalRuntimeBridgesCheckV1: true",
		"runtime: runtime:professional-runtime-bridges",
		path ? `artifact: ${path}` : undefined,
		`tool_index: ${report.toolIndexPath}`,
		`closure: specs=${report.closure.allBridgeSpecsPresent} fallback=${report.closure.allFallbacksAvailable} executable=${report.closure.allHaveExecutableTemplates} artifact=${report.closure.allHaveArtifactPlans} proof=${report.closure.allHaveProofExitMappings} env_ref=${report.closure.allEnvRefsSecretFree}`,
		"bridges:",
		...report.bridges.flatMap((bridge: any) => [
			`- bridge:${bridge.bridgeId} status=${bridge.status} fallback_available=${bridge.fallback_available}`,
			`  domains: ${bridge.domains.join(", ")}`,
			`  preferred_present: ${bridge.presentPreferred.join(", ") || "none"}`,
			`  fallback_present: ${bridge.presentFallbacks.join(", ") || "none"}`,
			`  command_templates: ${bridge.commandTemplates.join(" | ")}`,
			`  artifact_plan: ${bridge.artifactPlan.join(" | ")}`,
			`  env_refs: ${bridge.envRefs.join(", ")}`,
			`  proof_exit: ${bridge.proofExit.join("; ")}`,
			`  next: ${bridge.nextRuntimeCommands.join(" | ")}`,
		]),
		"next_runtime_commands:",
		...report.nextRuntimeCommands.map((item: any) => `- ${item}`),
		"invariants:",
		...report.invariants.map((item: any) => `- ${item}`),
	]
		.filter(Boolean)
		.join("\n");
}
