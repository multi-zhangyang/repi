/** Toolchain domain capability builder from index. */
import type {
	ToolchainDomainCapabilityRowV1,
	ToolchainDomainCapabilityV1,
	ToolchainDomainStatus,
} from "./toolchain-domain-data.ts";
import { TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX } from "./toolchain-domain-data.ts";

export function buildToolchainDomainCapabilityFromIndex(params: {
	domainFilter?: string;
	toolIndexPath: string;
	sourceCorpus: string;
	isToolPresent: (tool: string) => boolean;
	recommendInstall: (tools: string[]) => string[];
}): ToolchainDomainCapabilityV1 {
	const { domainFilter, toolIndexPath, sourceCorpus, isToolPresent, recommendInstall } = params;
	const specs = domainFilter
		? TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX.filter(
				(domain: any) => domain.id === domainFilter || domain.id.includes(domainFilter),
			)
		: TOOLCHAIN_DOMAIN_CAPABILITY_MATRIX;
	const domains = specs.map<ToolchainDomainCapabilityRowV1>((domain) => {
		const presentRequired = domain.requiredAny.filter((tool: any) => isToolPresent(tool));
		const presentPreferred = domain.preferred.filter((tool: any) => isToolPresent(tool));
		const presentFallbacks = domain.fallbacks.filter((tool: any) => isToolPresent(tool));
		const missingRequired = domain.requiredAny.filter((tool: any) => !isToolPresent(tool));
		const missingPreferred = domain.preferred.filter((tool: any) => !isToolPresent(tool));
		const status: ToolchainDomainStatus =
			presentRequired.length > 0 ? "ready" : presentFallbacks.length > 0 ? "degraded" : "blocked";
		const playbookMarkersFound = domain.playbookMarkers.filter((marker: any) => sourceCorpus.includes(marker));
		const commandScaffoldsFound = domain.commandScaffolds.filter((marker: any) => sourceCorpus.includes(marker));
		const recommendedInstallHints = recommendInstall(
			Array.from(new Set([...missingRequired, ...missingPreferred.slice(0, 5)])),
		);
		return {
			domainId: domain.id,
			label: domain.label,
			status,
			requiredAny: domain.requiredAny,
			preferred: domain.preferred,
			fallbacks: domain.fallbacks,
			presentRequired,
			presentPreferred,
			presentFallbacks,
			missingRequired,
			missingPreferred,
			fallback_available: presentFallbacks.length > 0 || status === "ready",
			critical_gap: status === "blocked",
			playbookMarkersFound,
			playbookMarkersMissing: domain.playbookMarkers.filter((marker: any) => !playbookMarkersFound.includes(marker)),
			commandScaffoldsFound,
			commandScaffoldsMissing: domain.commandScaffolds.filter(
				(marker: any) => !commandScaffoldsFound.includes(marker),
			),
			proofExit: domain.proofExit,
			recommendedInstallHints,
			nextRuntimeCommands: [
				"re_tool_index refresh",
				`re_toolchain_domain show ${domain.id}`,
				`re_lane plan ${domain.id} <target>`,
				...domain.commandScaffolds.map((scaffold: any) => `${scaffold} plan <target>`),
			].slice(0, 10),
		};
	});
	const readyCount = domains.filter((domain: any) => domain.status === "ready").length;
	const degradedCount = domains.filter((domain: any) => domain.status === "degraded").length;
	const blockedCount = domains.filter((domain: any) => domain.status === "blocked").length;
	return {
		kind: "ToolchainDomainCapabilityV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		runtime: "runtime:toolchain-doctor",
		discoveryMode: "tool-index",
		toolIndexPath,
		domains,
		coverage: {
			domainCount: domains.length,
			readyCount,
			degradedCount,
			blockedCount,
			readyOrDegradedCount: readyCount + degradedCount,
			fallbackDomainCount: domains.filter((domain: any) => domain.fallback_available).length,
		},
		toolchainClosure: {
			allDomainsHaveFallback: domains.every((domain: any) => domain.fallback_available || domain.status === "ready"),
			allDomainsHavePlaybookMarkers: domains.every((domain: any) => domain.playbookMarkersMissing.length === 0),
			allDomainsHaveCommandScaffolds: domains.every((domain: any) => domain.commandScaffoldsMissing.length === 0),
			noCriticalGap: blockedCount === 0,
		},
		nextActions: [
			"re_toolchain_domain refresh",
			"re_tool_index refresh",
			"re_bootstrap plan <missing-tool>",
			"re_lane plan <domain> <target>",
			"re_proof_loop run <target>",
		],
	};
}
