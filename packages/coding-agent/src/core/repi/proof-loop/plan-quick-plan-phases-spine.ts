/** Proof-loop quick plan spine/repair phase helpers. */

import { appendProofSpine } from "./plan-adapters.ts";
import type { RepiProofLoopGapClass, RepiProofLoopQuickPlanPhaseV1 } from "./types.ts";

type AddPhase = (
	phase: RepiProofLoopQuickPlanPhaseV1["phase"],
	reason: string,
	phaseClasses: RepiProofLoopGapClass[],
	phaseCommands: string[],
) => void;

export function applyProofLoopSpinePhases(params: {
	classes: Set<string>;
	targetRef: string;
	addPhase: AddPhase;
	items: Array<{ text: string }>;
	runtimeAdapterIdsFromGapText: (text: string) => string[];
}): void {
	const { classes, targetRef, addPhase, items, runtimeAdapterIdsFromGapText } = params;
	if (classes.has("runtime_adapter_gap")) {
		const adapterIds = Array.from(new Set(items.flatMap((item: any) => runtimeAdapterIdsFromGapText(item.text))));
		addPhase(
			"runtime_adapter_frontload",
			"collect live/runtime artifacts before verifier/compiler/replayer consumes stale evidence",
			["runtime_adapter_gap"],
			adapterIds.length === 0
				? [`re_runtime_adapter plan ${targetRef}`]
				: adapterIds.slice(0, 4).map((adapterId: any) => `re_runtime_adapter run ${adapterId} ${targetRef}`),
		);
		const proofSpine: string[] = [];
		appendProofSpine(proofSpine, targetRef, { includeAutofixPlan: true });
		addPhase(
			"proof_spine",
			"verify, compile, and replay the adapter artifacts once before patching",
			["runtime_adapter_gap"],
			proofSpine,
		);
	}
	if (classes.has("proof_spine_seed")) {
		const proofSpine: string[] = [];
		appendProofSpine(proofSpine, targetRef);
		addPhase(
			"proof_spine",
			"promote attack-graph proof-spine seeds through verifier/compiler/replayer",
			["proof_spine_seed"],
			proofSpine,
		);
	}
	if (classes.has("missing_artifact") || classes.has("weak_evidence") || classes.size === 0) {
		const proofSpine: string[] = [];
		appendProofSpine(proofSpine, targetRef, { includeAutofixPlan: true });
		addPhase(
			"proof_spine",
			"materialize missing/weak proof artifacts through verifier/compiler/replayer",
			["missing_artifact", "weak_evidence"],
			proofSpine,
		);
	}
	if (classes.has("replay_failure") || classes.has("timeout_or_flake")) {
		const replayRepair: string[] = [];
		appendProofSpine(replayRepair, targetRef, { includeAutofixPlan: true });
		replayRepair.push(`re_autofix apply ${targetRef}`, `re_replayer run ${targetRef} 2`);
		addPhase(
			"replay_repair",
			"convert replay/flake failure into autofix and a second deterministic replay",
			["replay_failure", "timeout_or_flake"],
			replayRepair,
		);
	}
	if (classes.has("contradiction")) {
		const contradictionRepair = [`re_supervisor repair ${targetRef}`];
		appendProofSpine(contradictionRepair, targetRef);
		addPhase(
			"contradiction_repair",
			"send counter-evidence through supervisor repair before promotion",
			["contradiction"],
			contradictionRepair,
		);
	}
	if (classes.has("unknown")) {
		addPhase(
			"delegate_unknown",
			"escalate unknown gaps to a bounded swarm and merge handoff evidence",
			["unknown"],
			[`re_delegate plan ${targetRef}`, `re_swarm run ${targetRef} 2 1`, "re_swarm merge"],
		);
	}
	if (
		classes.size > 0 &&
		!classes.has("missing_artifact") &&
		!classes.has("weak_evidence") &&
		!classes.has("contradiction") &&
		!classes.has("runtime_adapter_gap") &&
		!classes.has("replay_failure") &&
		!classes.has("timeout_or_flake")
	) {
		const proofSpine: string[] = [];
		appendProofSpine(proofSpine, targetRef);
		addPhase(
			"proof_spine",
			"close non-proof-spine gaps with verifier/compiler/replayer before final loop",
			[],
			proofSpine,
		);
	}
}
