/** Professional runtime bridge gate static next/invariants. */
export const PROFESSIONAL_RUNTIME_BRIDGE_NEXT_COMMANDS = [
	"re_runtime_bridge show",
	"re_runtime_bridge refresh",
	"re_runtime_bridge show web-cdp-replay",
	"re_runtime_bridge show mobile-frida",
	"re_native_runtime run <binary>",
	"re_exploit_lab run <target> 5",
	"re_live_browser run <url>",
	"re_mobile_runtime run <package>",
	"re_domain_proof_exit show",
] as const;

export const PROFESSIONAL_RUNTIME_BRIDGE_INVARIANTS = [
	"professional_runtime_bridge_check",
	"runtime_execution_bridge_matrix",
	"real_toolchain_bridge_contract",
	"exploit_verifier_runtime_contract",
	"web_cdp_replay_contract",
	"mobile_frida_dynamic_bridge_contract",
	"artifact_backed_tool_execution_plan",
	"env_ref_secret_boundary",
	"narrative_only_bridge_rejected",
] as const;
