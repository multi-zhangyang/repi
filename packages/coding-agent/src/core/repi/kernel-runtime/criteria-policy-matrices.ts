/** Kernel criteria: execution matrices + floors. */
import { d } from "./deps.ts";

export function kernelExecutionInvariants(): string[] {
	return [
		"execution_first: every reverse/pentest turn resolves into route -> map -> command pack -> runtime artifact -> verifier/replayer/proof loop",
		"authorized_task_bias: CTF/lab/owned/client-authorized/security-test context enters the execution chain without compliance-theater preamble",
		"scope_gap_to_passive_mapping: missing scope details become passive map, auth_context_gap, bounded_plan, operator_queue, and one path-changing question",
		"operator_command_floor: output must contain a next command, a tool call, an artifact path, or a minimal repro script",
		"evidence_over_intuition: live runtime/traffic/replay evidence outranks source names, comments, stale docs, and artifact labels",
		"one_flow_before_sideways: prove one end-to-end path before expanding to broad scan, campaign, swarm, or report",
		"bounded_dispatch: internal dispatcher runs bounded steps, records stdout/stderr/exit/hash, then routes failures through autofix/bootstrap",
		"memory_evolution: high-value commands, failures, anchors, and worker promotions are written to playbooks/knowledge graph before finalization",
	];
}

export function kernelOperatorCommandFloor(target?: string): string[] {
	const mappedTarget = d().commandTarget(target);
	return [
		`start_floor: re_kernel build ${mappedTarget} && re_decision_core tick ${mappedTarget}`,
		`map_floor: re_map ${mappedTarget} 2 or latest map artifact path`,
		"lane_floor: re_lane plan <active-lane> <target> plus fallback_commands/tool_bootstrap hints",
		"run_floor: re_lane run <active-lane> <target> or re_operator dispatch <target> 1 with bounded execution",
		"proof_floor: re_verifier matrix -> re_compiler draft -> re_replayer run -> re_autofix plan/apply -> re_proof_loop run",
		"report_floor: key_evidence_block + repro_commands + contradiction/gap status + next_operator_command",
	];
}

export function kernelSpecialistCapabilityMatrix(route?: string): string[] {
	const base = [
		"native-deep: ELF/PE/Mach-O/WASM symbol/import/string map, decompiler project, compare breakpoint trace, patch hypothesis, symbolic/fuzz scaffold",
		"pwn-primitive: mitigation/libc fingerprint, cyclic crash, offset analyzer, gadget/ROP/libc chain, local verifier, pwntools template",
		"web-authz: browser/CDP capture, route graph, auth matrix, IDOR/BOLA probe, state machine, sequence replay, ownership and rollback proof",
		"web-scan: httpx/katana/ffuf/nuclei scanner queue, content discovery, manual replay verifier, body hash/status proof",
		"js-signing: fetch/XHR/WS/crypto.subtle hook, observed normalizer, first-divergence, signed replay harness",
		"mobile-runtime: APK inventory, ADB/Frida process map, Java crypto/String/native compare hooks, anti-debug/root checks",
		"ios-runtime: IPA/Info.plist/entitlements, Mach-O/class map, Frida/objection hooks, keychain/network replay",
		"memory-forensics: volatility image profile, process/network map, credential/artifact hunt, timeline/carve proof",
		"firmware-dfir: firmware/rootfs extraction, service surface, emulation scaffold, PCAP stream ranking, secret timeline, transform chain",
		"cloud-identity: env/profile/serviceaccount map, runtime manifests/RBAC, metadata probe, privilege edge report",
		"agentsec-malware: prompt/tool/memory/delegation boundary replay plus malware static/rule/IOC/behavior config recovery",
	];
	const lower = (route ?? "").toLowerCase();
	if (/native|reverse|pwn/.test(lower)) {
		return ["active_route_focus=native-deep+pwn-primitive+native-runtime+exploit-lab", ...base];
	}
	if (/web|api|frontend|js/.test(lower)) return ["active_route_focus=web-authz+js-signing+live-browser", ...base];
	if (/mobile|android/.test(lower)) return ["active_route_focus=mobile-runtime+frida-gdb+native-deep", ...base];
	if (/cloud|container|identity|ad|windows/.test(lower))
		return ["active_route_focus=cloud-identity+identity-ad+operation/delegate/swarm", ...base];
	return base;
}
