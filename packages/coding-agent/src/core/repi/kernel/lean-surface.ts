import { APP_NAME, IS_REPI_PRODUCT } from "../../../config.ts";

/**
 * Product lean operator surface allowlists.
 * Product mode defaults to lean execution surface; set REPI_FULL_SURFACE=1 for full registration.
 * Narrative/control-plane tools (re_kernel, re_decision_core, campaign/swarm/autopilot/subagent/reflect) stay full-surface only via allowlist + install gates. re_operator is lean so reverse can dispatch bounded queues.
 */
export function isRepiFullSurface(): boolean {
	const flag = process.env.REPI_FULL_SURFACE?.trim().toLowerCase();
	if (flag === "1" || flag === "true" || flag === "full" || flag === "on") return true;
	if (flag === "0" || flag === "false" || flag === "lean" || flag === "off") return false;
	// Product binary (repi) and REPI_PRODUCT/PRIMARY default to LEAN operator surface.
	// Narrative/control bloat requires explicit REPI_FULL_SURFACE=1.
	const product =
		IS_REPI_PRODUCT || process.env.REPI_PRODUCT === "1" || process.env.REPI_PRIMARY === "1" || APP_NAME === "repi";
	return !product;
}

export const REPI_LEAN_TOOL_ALLOW = new Set([
	"re_route",
	"re_techniques",
	"re_map",
	"re_mission",
	"re_lane",
	"re_evidence",
	"re_bootstrap",
	"re_tool_index",
	"re_runtime_adapter",
	"re_native_runtime",
	"re_live_browser",
	"re_web_authz_state",
	"re_js_signing",
	"re_mobile_runtime",
	"re_exploit_lab",
	"re_complete",
	"re_verifier",
	"re_replayer",
	"re_proof_loop",
	"re_graph",
	"re_operator",
	"re_note",
	"re_domain_proof_exit",
	"re_profile_check",
]);

export const REPI_LEAN_COMMAND_ALLOW = new Set([
	"re-route",
	"re-map",
	"re-mission",
	"re-lane",
	"re-evidence",
	"re-bootstrap",
	"re-tools",
	"re-runtime-adapter",
	"re-native-runtime",
	"re-live-browser",
	"re-web-authz-state",
	"re-js-signing",
	"re-mobile-runtime",
	"re-exploit-lab",
	"re-complete",
	"re-verifier",
	"re-replayer",
	"re-proof-loop",
	"re-graph",
	"re-operator",
	"re-domain-proof-exit",
	"re-profile-check",
	"re-toolchain",
	"re-techniques",
]);
