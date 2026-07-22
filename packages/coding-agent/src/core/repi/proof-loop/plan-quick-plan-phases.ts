/** Build proof-loop quick plan phases from gap items (includes reverse seed). */
import { uniqueNonEmpty } from "../text.ts";
import { classifyRepiProofLoopGap, repiProofLoopClassOrderFromItems } from "./classify.ts";
import { applyRepiProofLoopQuickPlanPhases } from "./plan-quick-plan-phases-apply.ts";
import type { RepiProofLoopGapClass, RepiProofLoopGapItem, RepiProofLoopQuickPlanPhaseV1 } from "./types.ts";

export function buildRepiProofLoopQuickPlanPhases(
	items: RepiProofLoopGapItem[],
	target?: string,
): {
	targetRef: string;
	classOrder: ReturnType<typeof repiProofLoopClassOrderFromItems>;
	classes: Set<string>;
	commands: string[];
	phases: RepiProofLoopQuickPlanPhaseV1[];
} {
	const targetRef = target?.trim() || "<target>";
	const classOrder = repiProofLoopClassOrderFromItems(items);
	const classes = new Set(classOrder.map((row: any) => row.klass));
	const commands: string[] = [];
	const phases: RepiProofLoopQuickPlanPhaseV1[] = [];
	const addPhase = (
		phase: RepiProofLoopQuickPlanPhaseV1["phase"],
		reason: string,
		phaseClasses: RepiProofLoopGapClass[],
		phaseCommands: string[],
	): void => {
		const accepted: string[] = [];
		for (const command of phaseCommands) {
			if (commands.includes(command)) continue;
			commands.push(command);
			accepted.push(command);
		}
		if (!accepted.length) return;
		const evidenceRefs = uniqueNonEmpty(
			items
				.filter(
					(item: any) => phaseClasses.length === 0 || phaseClasses.includes(classifyRepiProofLoopGap(item).klass),
				)
				.flatMap((item: any) => item.sourceArtifacts),
			8,
		);
		phases.push({ phase, reason, classes: phaseClasses, commands: accepted, evidenceRefs });
	};
	applyRepiProofLoopQuickPlanPhases({
		items,
		target,
		targetRef,
		classes,
		commands,
		phases,
		addPhase,
	});
	return { targetRef, classOrder, classes, commands, phases };
}
