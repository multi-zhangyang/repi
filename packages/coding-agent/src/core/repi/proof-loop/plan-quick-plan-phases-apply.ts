/** Apply classified gap items into proof-loop quick plan phases. */

import { runtimeAdapterIdsFromGapText } from "./classify.ts";
import { applyProofLoopSpinePhases } from "./plan-quick-plan-phases-spine.ts";
import { seedProofLoopQuickPlanReversePhase } from "./plan-quick-reverse.ts";
import type { RepiProofLoopGapClass, RepiProofLoopGapItem, RepiProofLoopQuickPlanPhaseV1 } from "./types.ts";

export function applyRepiProofLoopQuickPlanPhases(params: {
	items: RepiProofLoopGapItem[];
	target?: string;
	targetRef: string;
	classes: Set<string>;
	commands: string[];
	phases: RepiProofLoopQuickPlanPhaseV1[];
	addPhase: (
		phase: RepiProofLoopQuickPlanPhaseV1["phase"],
		reason: string,
		phaseClasses: RepiProofLoopGapClass[],
		phaseCommands: string[],
	) => void;
}): void {
	const { items, target, targetRef, classes, addPhase } = params;
	seedProofLoopQuickPlanReversePhase(items, classes, addPhase as any, target);
	if (items.some((item: any) => item.source === "attack_graph")) {
		addPhase("attack_graph_refresh", "refresh task tree before closing attack-graph gaps", [], ["re_graph build"]);
	}
	if (classes.has("compact_resume")) {
		addPhase(
			"compact_resume_reentry",
			"resume the packed proof state before dispatching more tools",
			["compact_resume"],
			["re_context resume", "re_complete audit", `re_runtime_adapter run ${targetRef}`],
		);
	}
	if (classes.has("tool_or_dependency")) {
		addPhase(
			"toolchain_repair",
			"repair missing tools/dependencies before replaying proof commands",
			["tool_or_dependency"],
			["re_bootstrap plan", `re_operator dispatch ${targetRef} 1`],
		);
	}
	if (classes.has("target_or_state")) {
		addPhase(
			"target_state_refresh",
			"refresh volatile target/session state before proof replay",
			["target_or_state"],
			[`re_map ${targetRef}`, `re_live_browser run ${targetRef}`, `re_web_authz_state run ${targetRef}`],
		);
	}
	applyProofLoopSpinePhases({
		classes,
		targetRef,
		addPhase,
		items,
		runtimeAdapterIdsFromGapText,
	});
}
