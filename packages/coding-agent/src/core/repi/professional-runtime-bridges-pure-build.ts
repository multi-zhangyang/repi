/** Professional runtime bridge index-backed gate builder. */
import type {
	ProfessionalRuntimeBridgeRowV1,
	ProfessionalRuntimeBridgesCheckV1,
} from "./professional-runtime-bridges-data.ts";
import { PROFESSIONAL_RUNTIME_BRIDGE_MATRIX } from "./professional-runtime-bridges-data.ts";
import {
	PROFESSIONAL_RUNTIME_BRIDGE_INVARIANTS,
	PROFESSIONAL_RUNTIME_BRIDGE_NEXT_COMMANDS,
} from "./professional-runtime-bridges-pure-build-static.ts";
import { runtimeBridgeSecretLike } from "./professional-runtime-bridges-pure-format.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
export function buildProfessionalRuntimeBridgesGateFromIndex(params: {
	bridgeFilter?: string;
	toolIndexPath: string;
	sourceCorpus: string;
	isToolPresent: (tool: string) => boolean;
}): ProfessionalRuntimeBridgesCheckV1 {
	const { bridgeFilter, toolIndexPath, sourceCorpus, isToolPresent } = params;
	const specs = bridgeFilter
		? PROFESSIONAL_RUNTIME_BRIDGE_MATRIX.filter(
				(bridge: any) => bridge.id === bridgeFilter || bridge.id.includes(bridgeFilter),
			)
		: PROFESSIONAL_RUNTIME_BRIDGE_MATRIX;
	const bridges = specs.map<ProfessionalRuntimeBridgeRowV1>((bridge) => {
		const presentPreferred = bridge.preferredTools.filter((tool: any) => isToolPresent(tool));
		const presentFallbacks = bridge.fallbackTools.filter((tool: any) => isToolPresent(tool));
		const missingPreferred = bridge.preferredTools.filter((tool: any) => !isToolPresent(tool));
		const proofExitFound = bridge.proofExit.filter((marker: any) => sourceCorpus.includes(marker));
		const artifactPlanOk =
			bridge.artifactPlan.length >= 3 &&
			bridge.artifactPlan.every((path: any) => path.startsWith(".repi/evidence") || path.startsWith(".repi/recon"));
		const envRefOnly = bridge.envRefs.every(
			(ref: any) => /^[A-Z][A-Z0-9_]+$/.test(ref) && !runtimeBridgeSecretLike(ref),
		);
		const executableTemplateCount = bridge.commandTemplates.filter((template: any) =>
			/\bre_[a-z0-9_]+\b|\bcurl\b|\bfrida\b|\bgdb\b|\bpython3\b|\bnode\b/.test(template),
		).length;
		return {
			bridgeId: bridge.id,
			title: bridge.title,
			status: presentFallbacks.length > 0 ? "runtime-ready" : "blocked",
			domains: bridge.domains,
			preferredTools: bridge.preferredTools,
			fallbackTools: bridge.fallbackTools,
			presentPreferred,
			presentFallbacks,
			missingPreferred,
			fallback_available: presentFallbacks.length > 0,
			commandTemplates: bridge.commandTemplates,
			artifactPlan: bridge.artifactPlan,
			artifactPlanOk,
			envRefs: bridge.envRefs,
			envRefOnly,
			proofExit: bridge.proofExit,
			proofExitFound,
			proofExitMissing: bridge.proofExit.filter((marker: any) => !proofExitFound.includes(marker)),
			executableTemplateCount,
			narrativeOnly: executableTemplateCount === 0,
			nextRuntimeCommands: Array.from(
				new Set(
					[
						"re_runtime_bridge refresh",
						`re_runtime_bridge show ${bridge.id}`,
						bridge.id === "web-cdp-replay" ? "re_live_browser run <url>" : undefined,
						bridge.id === "mobile-frida" ? "re_mobile_runtime run <package>" : undefined,
						bridge.id === "exploit-verifier-runtime" ? "re_exploit_lab run <target> 5" : undefined,
						bridge.id === "native-pwn" ||
						bridge.domains.some((d: any) => /native|pwn|binary|malware|firmware/i.test(d))
							? "re_native_runtime run <binary>"
							: undefined,
						"re_domain_proof_exit write <domain>",
						...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida/i.test(
							`${bridge.id} ${bridge.domains.join(" ")} ${bridge.title}`,
						)
							? reverseDomainCaptureNextCommands({
									routeOrBlob: `${bridge.id} ${bridge.domains.join(" ")} ${bridge.title}`,
									target: bridge.id,
								}).slice(0, 4)
							: []),
					].filter((item): item is string => Boolean(item)),
				),
			).slice(0, 10),
		};
	});
	return {
		kind: "ProfessionalRuntimeBridgesCheckV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		ProfessionalRuntimeBridgesCheckV1: true,
		runtime: "runtime:professional-runtime-bridges",
		toolIndexPath,
		requiredChecks: [
			"professional_runtime_bridge_check",
			"runtime_execution_bridge_matrix",
			"real_toolchain_bridge_contract",
			"exploit_verifier_runtime_contract",
			"web_cdp_replay_contract",
			"mobile_frida_dynamic_bridge_contract",
			"artifact_backed_tool_execution_plan",
			"env_ref_secret_boundary",
		],
		bridges,
		closure: {
			allBridgeSpecsPresent: bridges.length === PROFESSIONAL_RUNTIME_BRIDGE_MATRIX.length || Boolean(bridgeFilter),
			allFallbacksAvailable: bridges.every((bridge: any) => bridge.fallback_available),
			allHaveExecutableTemplates: bridges.every(
				(bridge: any) => !bridge.narrativeOnly && bridge.executableTemplateCount >= 3,
			),
			allHaveArtifactPlans: bridges.every((bridge: any) => bridge.artifactPlanOk),
			allHaveProofExitMappings: bridges.every(
				(bridge: any) => bridge.proofExit.length >= 5 && bridge.proofExitMissing.length === 0,
			),
			allEnvRefsSecretFree: bridges.every((bridge: any) => bridge.envRefOnly),
		},
		nextRuntimeCommands: [...PROFESSIONAL_RUNTIME_BRIDGE_NEXT_COMMANDS],
		invariants: [...PROFESSIONAL_RUNTIME_BRIDGE_INVARIANTS],
	};
}
