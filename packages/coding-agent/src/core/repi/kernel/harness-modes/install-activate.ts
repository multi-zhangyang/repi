/** Route-aware tool activation + harness startup packet. */
import type { ExtensionAPI, ExtensionContext } from "../../../extensions/types.ts";
import { isRepiFullSurface, REPI_LEAN_TOOL_ALLOW } from "../lean-surface.ts";
import { CORE_ACTIVE_TOOLS, DOMAIN_ACTIVE_TOOLS, toolsForMode } from "./active-tools.ts";
import type { RepiHarnessModeState } from "./types.ts";

const REVERSE_DOMAIN_RE =
	/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|crypto/i;

const REVERSE_RUN_FIRST_TOOLS = [
	"re_domain_proof_exit",
	"re_native_runtime",
	"re_runtime_adapter",
	"re_live_browser",
	"re_js_signing",
	"re_web_authz_state",
	"re_complete",
	"re_bootstrap",
	"re_replayer",
] as const;

export function activateToolsForRoute(
	pi: ExtensionAPI,
	state: RepiHarnessModeState,
	domain: string,
	ctx: ExtensionContext | undefined,
	applyTools: (ctx?: ExtensionContext) => void,
): string[] {
	if (state.permissionMode === "plan") {
		applyTools(ctx);
		return toolsForMode("plan", [...CORE_ACTIVE_TOOLS]);
	}
	const domainTools = DOMAIN_ACTIVE_TOOLS[domain] ?? ["re_graph", "re_verifier", "re_domain_proof_exit"];
	let active = Array.from(new Set([...CORE_ACTIVE_TOOLS, ...domainTools]));
	// Reverse-heavy routes always keep run-first proof/capture tools on the lean surface.
	if (REVERSE_DOMAIN_RE.test(domain)) {
		active = Array.from(new Set([...active, ...REVERSE_RUN_FIRST_TOOLS]));
	}
	// Full surface may add isolation workers; lean product stays on registered allowlist only.
	if (isRepiFullSurface()) {
		active = Array.from(new Set([...active, "re_subagent"]));
	} else {
		// Keep non-re_ core tools (read/bash/...) and lean-allowlisted re_* only.
		// Reverse run-first tools are already on REPI_LEAN_TOOL_ALLOW.
		active = active.filter((name: any) => !name.startsWith("re_") || REPI_LEAN_TOOL_ALLOW.has(name));
	}
	pi.setActiveTools(active);
	pi.appendEntry("repi-dynamic-tools", {
		timestamp: Date.now(),
		domain,
		active,
		lean: !isRepiFullSurface(),
		reverseHeavy: REVERSE_DOMAIN_RE.test(domain),
	});
	if (ctx?.hasUI) {
		ctx.ui.setStatus("repi-tools", `${active.length} tools`);
	}
	return active;
}

export function startupHarnessPacketLines(state: RepiHarnessModeState): string[] {
	return [
		`permission_mode: ${state.permissionMode}`,
		`plan_todos: ${state.planTodos.length}`,
		`execution_armed: ${state.executionArmed}`,
		"harness:",
		"- /plan on|off|show|execute  (Claude Code-style plan→approve→run)",
		"- /permission default|plan|acceptEdits|bypass",
		"- Plan mode is read-only; write a numbered `Plan:` section, then /plan execute.",
		"- Mark progress with [DONE:n] after each step.",
		"- Env: REPI_PLAN=1 or REPI_PERMISSION_MODE=plan starts in plan mode.",
		"- Reverse tools stay loaded (native/mobile/web/adapter/proof). Prefer calling them over narration.",
		"- Reverse plan template: re_map → re_bootstrap → re_native_runtime/re_live_browser/re_runtime_adapter → re_domain_proof_exit → re_complete audit",
		"- Reverse run-first: call re_* run tools immediately for proof.exit=partial|strong; do not stall on long plans",
		"- Parallel tool calls are allowed when independent (route+map, multi-probe).",
	];
}
