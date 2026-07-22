/** Proof-loop quick path / adapter closure / specialist queue. */
// Landmark: proofLoopQuickPlanRows reverseDomainCaptureNextCommands proofLoopTargetRuntimeAdapterCommands reverse_proof_exit_gate
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import {
	repiProofLoopQuickPathFromItems as proofLoopQuickPathFromItems,
	repiProofLoopRuntimeAdapterClosureRows as proofLoopRuntimeAdapterClosureRows,
	repiProofLoopSpecialistQueueFromItems as proofLoopSpecialistQueueFromItems,
} from "../../proof-loop.ts";
import { formatProofLoopRuntimeAdapterClosureRow } from "../../proof-loop-runtime/format.ts";
import { proofLoopGapItems } from "./items.ts";

export { proofLoopQuickPlanRows } from "./quick-plan.ts";
export { proofLoopTargetRuntimeAdapterCommands } from "./quick-target.ts";

import { proofLoopQuickPlanRows } from "./quick-plan.ts";
import { proofLoopTargetRuntimeAdapterCommands } from "./quick-target.ts";

export function proofLoopQuickPathFromGapItems(items: ProofLoopGapItem[], target?: string): string[] {
	return Array.from(
		new Set([...proofLoopTargetRuntimeAdapterCommands(target), ...proofLoopQuickPathFromItems(items, target)]),
	);
}
export function proofLoopQuickPath(target?: string): string[] {
	return proofLoopQuickPlanRows(proofLoopGapItems(target), target).commands;
}
export function proofLoopRuntimeAdapterClosure(target?: string): string[] {
	return proofLoopRuntimeAdapterClosureRows(proofLoopGapItems(target), target)
		.map(formatProofLoopRuntimeAdapterClosureRow)
		.slice(0, 12);
}
export function proofLoopSpecialistQueue(target?: string): string[] {
	return proofLoopSpecialistQueueFromItems(proofLoopGapItems(target), target);
}
