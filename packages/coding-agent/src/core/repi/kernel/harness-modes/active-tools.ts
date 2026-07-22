/** Plan/accept/core/domain active tool sets for reverse product surface. */

export const PLAN_MODE_TOOLS = [
	"read",
	"bash",
	"grep",
	"find",
	"ls",
	"re_route",
	"re_map",
	"re_techniques",
	"re_tool_index",
	"re_mission",
	"re_evidence",
	// reverse/web plan surface (read/plan/show only — mutations still blocked by tool_call gate)
	"re_bootstrap",
	"re_domain_proof_exit",
	"re_runtime_adapter",
	"re_native_runtime",
	"re_exploit_lab",
	"re_mobile_runtime",
	"re_live_browser",
	"re_js_signing",
	"re_web_authz_state",
	"re_verifier",
	"re_replayer",
	"re_proof_loop",
	"re_graph",
	"re_complete",
] as const;
export const ACCEPT_EDITS_TOOLS = [
	"read",
	"bash",
	"grep",
	"find",
	"ls",
	"edit",
	"write",
	"re_route",
	"re_map",
	"re_lane",
	"re_techniques",
	"re_tool_index",
	"re_mission",
	"re_evidence",
	"re_bootstrap",
	"re_runtime_adapter",
	"re_native_runtime",
	"re_exploit_lab",
	"re_mobile_runtime",
	"re_live_browser",
	"re_js_signing",
	"re_web_authz_state",
	"re_domain_proof_exit",
	"re_verifier",
	"re_replayer",
	"re_proof_loop",
	"re_graph",
	"re_complete",
] as const;

/** Always-on reverse execution surface (lean product). Domain packs add emphasis only. */
export const CORE_ACTIVE_TOOLS = [
	"read",
	"bash",
	"edit",
	"write",
	"grep",
	"find",
	"ls",
	"re_route",
	"re_map",
	"re_lane",
	"re_techniques",
	"re_tool_index",
	"re_mission",
	"re_evidence",
	"re_bootstrap",
	"re_runtime_adapter",
	"re_native_runtime",
	"re_exploit_lab",
	"re_mobile_runtime",
	"re_live_browser",
	"re_js_signing",
	"re_web_authz_state",
	"re_domain_proof_exit",
	"re_verifier",
	"re_replayer",
	"re_proof_loop",
	"re_graph",
	"re_operator",
	"re_profile_check",
	"re_complete",
	"re_note",
] as const;

export { DOMAIN_ACTIVE_TOOLS } from "./active-tools-domain.ts";
export function toolsForMode(mode: import("./types.ts").RepiPermissionMode, allToolNames: string[]): string[] {
	if (mode === "bypass" || mode === "default") return allToolNames;
	if (mode === "plan") {
		const preferred = PLAN_MODE_TOOLS.filter((name: any) => allToolNames.includes(name));
		return preferred.length ? preferred : ["read", "bash", "grep", "find", "ls"];
	}
	const preferred = ACCEPT_EDITS_TOOLS.filter((name: any) => allToolNames.includes(name));
	return preferred.length
		? preferred
		: allToolNames.filter((name: any) => !["re_swarm", "re_subagent"].includes(name));
}
