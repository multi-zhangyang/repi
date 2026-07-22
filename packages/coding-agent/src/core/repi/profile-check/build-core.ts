/** Build profile-check artifact. */
// Landmark: reverseCapabilityGuards reverse-capability profileCheckReverseCapabilityMarkers
import { getAgentDir } from "../../../config.ts";
import { ensureReconStorage } from "../resources.ts";
import { buildProfileCheckRows } from "./build-core-checks.ts";
import {
	profileCheckCriticalMarkers,
	profileCheckMarkerChecks,
	profileCheckReverseCapabilityMarkers,
	profileCheckSourceCorpus,
	profileCheckVerdict,
} from "./checks.ts";
import type { ProfileCheckArtifact, ProfileCheckMode } from "./types.ts";

const RECON_TOOL_NAMES: string[] = [];
const RECON_COMMAND_NAMES: string[] = [];

export function buildProfileCheckArtifact(mode: ProfileCheckMode = "quick"): ProfileCheckArtifact {
	ensureReconStorage();
	const checks = buildProfileCheckRows(mode);
	const corpus = profileCheckSourceCorpus();
	const criticalChecks = profileCheckMarkerChecks("regression", profileCheckCriticalMarkers(), corpus);
	const reverseChecks = profileCheckMarkerChecks("reverse-capability", profileCheckReverseCapabilityMarkers(), corpus);
	checks.push(...criticalChecks, ...reverseChecks);
	const capabilityMatrix = [
		`registered_tools=${Array.from(RECON_TOOL_NAMES).join(",")}`,
		`registered_commands=${Array.from(RECON_COMMAND_NAMES).join(",")}`,
		"execution_chain=route/mission/kernel -> decision/map/lane/autopilot -> campaign/operation/delegate/swarm/supervisor/reflect -> context/operator -> verifier/compiler/replayer/autofix -> proof_loop/knowledge_graph/profile_check",
		"runtime_domains=native,web_authz,live_browser,mobile,exploit_lab,pwn,pcap,firmware,agentsec,malware,cloud,identity,frida_gdb",
		"domain_toolchain_matrix=ToolchainDomainCapabilityV1 runtime:toolchain-doctor domain:web-api domain:web-scan domain:frontend-js domain:rev-native domain:pwn domain:mobile domain:mobile-ios domain:pcap-dfir domain:memory-forensics domain:firmware-iot domain:crypto domain:cloud-identity domain:exploit-reliability fallback_available",
		"runtime_execution_bridge_matrix=ProfessionalRuntimeBridgesCheckV1 runtime:professional-runtime-bridges bridge-rev-ghidra-r2-angr verifier-pwn-crash-offset-primitive-exploit cdp-network-capture mobile-frida-java-hook-template",
		"adapter_execution_matrix=RuntimeAdapterExecutionCheckV1 runtime:adapter-execution adapter_runner_parser_ingest_contract adapter-r2-native-xref-runner adapter-frida-mobile-hook-runner adapter-web-cdp-network-runner adapter-pwntools-local-verifier-runner",
		"compact_chain=repi-compaction -> re_context resume -> re_operator dispatch -> re_proof_loop -> compact_resume_case_memory -> case_memory_lane_plan",
	];
	const installReadiness = [
		`agent_dir=${getAgentDir()}`,
		...checks
			.filter(
				(check) =>
					check.id.startsWith("install:") ||
					check.id.startsWith("install-script:") ||
					check.id === "storage:tool-index",
			)
			.map((check: any) => `${check.status}:${check.id}:${check.evidence.join(" | ")}`),
		"verify_command=node scripts/reverse-agent/repi-smoke.mjs . --json",
		"install_command=npm run install:repi",
		"help_smoke=REPI_OFFLINE=1 ./repi --offline --help",
	];
	const regressionGuards = [
		...criticalChecks.map((check: any) => `${check.status}:${check.id}:${check.evidence[0] ?? ""}`),
		"transpile_guard=node TypeScript transpile packages/coding-agent/src/core/recon-profile.ts repi-profile/extensions/reverse-pentest-core.ts",
		"focused_tests=node node_modules/vitest/dist/cli.js --run packages/coding-agent/test/recon-profile-inline-profile.test.ts packages/coding-agent/test/recon-profile-context-resume.test.ts packages/coding-agent/test/recon-profile-memory-store-v5.test.ts packages/coding-agent/test/recon-profile-lane-quality.test.ts packages/coding-agent/test/args.test.ts",
		"repo_check=npm run check",
	];
	const reverseCapabilityGuards = reverseChecks.map(
		(check) => `${check.status}:${check.id}:${check.evidence[0] ?? ""}`,
	);
	const verdict = profileCheckVerdict(checks);
	const nextActions = Array.from(
		new Set([
			...checks.flatMap((check: any) => (check.status === "pass" ? [] : (check.next ?? []))),
			...(verdict === "fail"
				? ["repair failing profile checks", "re_profile_check full", "npm run check"]
				: ["re_profile_check full", "node scripts/reverse-agent/repi-smoke.mjs . --json"]),
		]),
	).slice(0, 24);
	return {
		timestamp: new Date().toISOString(),
		mode,
		verdict,
		checks,
		capabilityMatrix,
		installReadiness,
		regressionGuards,
		reverseCapabilityGuards,
		nextActions,
		sourceArtifacts: Array.from(new Set(corpus.paths)).slice(0, 48),
	};
}
