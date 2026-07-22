/** Toolchain domain capability formatter. */
import type { ToolchainDomainCapabilityV1 } from "./toolchain-domain-data.ts";

export function formatToolchainDomainCapability(report: ToolchainDomainCapabilityV1, path?: string): string {
	return [
		"toolchain_domain_capability:",
		"ToolchainDomainCapabilityV1: true",
		"runtime: runtime:toolchain-doctor",
		path ? `artifact: ${path}` : undefined,
		`tool_index: ${report.toolIndexPath}`,
		`coverage: domains=${report.coverage.domainCount} ready=${report.coverage.readyCount} degraded=${report.coverage.degradedCount} blocked=${report.coverage.blockedCount}`,
		`closure: fallback=${report.toolchainClosure.allDomainsHaveFallback} playbook=${report.toolchainClosure.allDomainsHavePlaybookMarkers} commands=${report.toolchainClosure.allDomainsHaveCommandScaffolds} noCriticalGap=${report.toolchainClosure.noCriticalGap}`,
		"domains:",
		...report.domains.flatMap((domain: any) => [
			`- domain:${domain.domainId} status=${domain.status} fallback_available=${domain.fallback_available} critical_gap=${domain.critical_gap}`,
			`  label: ${domain.label}`,
			`  required_present: ${domain.presentRequired.join(", ") || "none"}`,
			`  preferred_present: ${domain.presentPreferred.join(", ") || "none"}`,
			`  fallback_present: ${domain.presentFallbacks.join(", ") || "none"}`,
			`  missing_required: ${domain.missingRequired.join(", ") || "none"}`,
			`  proof_exit: ${domain.proofExit.join("; ")}`,
			`  command_scaffolds: ${domain.commandScaffoldsFound.join(", ") || "none"}`,
			`  next: ${domain.nextRuntimeCommands.slice(0, 4).join(" | ")}`,
		]),
		"next_actions:",
		...report.nextActions.map((item: any) => `- ${item}`),
	]
		.filter(Boolean)
		.join("\n");
}
