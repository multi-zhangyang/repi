/** Harness mode active-tool application (reverse-first tool seed). */
import type { ExtensionAPI, ExtensionContext } from "../../../extensions/types.ts";
import { toolsForMode } from "./active-tools.ts";
import { footerLabel } from "./message-helpers.ts";
import type { RepiHarnessModeState } from "./types.ts";

/** Lean reverse/product tool seed used until full tool registry discovery is available. */
export const REPI_HARNESS_KNOWN_TOOL_SEED: string[] = [
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
	"re_complete",
	"re_subagent",
	"re_swarm",
	"re_domain_proof_exit",
	"re_native_runtime",
	"re_live_browser",
];

export function createHarnessApplyTools(
	pi: ExtensionAPI,
	state: RepiHarnessModeState,
): {
	applyTools: (ctx?: ExtensionContext) => void;
	getKnownTools: () => string[];
	setKnownTools: (tools: string[]) => void;
} {
	let knownTools: string[] = [];
	const applyTools = (ctx?: ExtensionContext) => {
		if (knownTools.length === 0) {
			knownTools = [...REPI_HARNESS_KNOWN_TOOL_SEED];
		}
		pi.setActiveTools(toolsForMode(state.permissionMode, knownTools));
		if (ctx?.hasUI) {
			ctx.ui.setStatus("repi-mode", footerLabel(state));
			if (state.permissionMode === "plan" && state.planTodos.length > 0) {
				ctx.ui.setWidget(
					"repi-plan",
					state.planTodos.map(
						(item: any, index: any) => `${item.completed ? "[x]" : "[ ]"} ${index + 1}. ${item.text}`,
					),
				);
			} else if (ctx.ui.setWidget) {
				ctx.ui.setWidget("repi-plan", undefined);
			}
		}
	};
	return {
		applyTools,
		getKnownTools: () => knownTools,
		setKnownTools: (tools: string[]) => {
			knownTools = tools;
		},
	};
}
