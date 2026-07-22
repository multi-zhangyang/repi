/** Proof-loop runtime adapter command/closure helpers. */

import { uniqueNonEmpty } from "../text.ts";
import { proofSignalListFromGapText, runtimeAdapterIdsFromGapText } from "./classify.ts";
import { classifyRepiProofLoopGap } from "./classify-core.ts";
import type { RepiProofLoopGapItem, RepiProofLoopRuntimeAdapterClosureRowV1 } from "./types.ts";

export function repiProofLoopCommandTarget(target?: string): string {
	return target?.trim() ? ` ${target.trim()}` : "";
}

export function repiProofLoopRuntimeAdapterCommands(adapterIds: string[], target?: string): string[] {
	const targetRef = target?.trim();
	if (!targetRef) return [];
	return Array.from(new Set(adapterIds.filter((adapterId: any) => /^[a-z0-9][a-z0-9-]*-adapter$/i.test(adapterId))))
		.slice(0, 4)
		.map((adapterId: any) => `re_runtime_adapter run ${adapterId} ${targetRef}`);
}

export function repiProofLoopRuntimeAdapterClosureRows(
	items: RepiProofLoopGapItem[],
	target?: string,
): RepiProofLoopRuntimeAdapterClosureRowV1[] {
	const rows = new Map<string, RepiProofLoopRuntimeAdapterClosureRowV1>();
	const targetRef = target?.trim() || "<target>";
	for (const item of items) {
		const klass = classifyRepiProofLoopGap(item).klass;
		if (klass !== "runtime_adapter_gap" && klass !== "proof_spine_seed") continue;
		for (const adapterId of runtimeAdapterIdsFromGapText(item.text)) {
			const current =
				rows.get(adapterId) ??
				({
					kind: "ProofLoopRuntimeAdapterClosureRowV1",
					schemaVersion: 1,
					adapterId,
					status: "proof_spine_ready",
					missingProofSignals: [],
					matchedProofSignals: [],
					sourceArtifacts: [],
					commands: [],
				} satisfies RepiProofLoopRuntimeAdapterClosureRowV1);
			if (klass === "runtime_adapter_gap") current.status = "needs_adapter_rerun";
			current.missingProofSignals = uniqueNonEmpty(
				[...current.missingProofSignals, ...proofSignalListFromGapText(item.text, "missing")],
				12,
			);
			current.matchedProofSignals = uniqueNonEmpty(
				[...current.matchedProofSignals, ...proofSignalListFromGapText(item.text, "matched")],
				12,
			);
			current.sourceArtifacts = uniqueNonEmpty([...current.sourceArtifacts, ...item.sourceArtifacts], 12);
			current.commands =
				current.status === "needs_adapter_rerun"
					? repiProofLoopRuntimeAdapterCommands([adapterId], targetRef)
					: [
							`re_verifier matrix ${targetRef}`,
							`re_compiler draft ${targetRef}`,
							`re_replayer run ${targetRef} 1`,
						];
			rows.set(adapterId, current);
		}
	}
	return Array.from(rows.values()).sort((left: any, right: any) => left.adapterId.localeCompare(right.adapterId));
}

export function appendProofSpine(
	commands: string[],
	target?: string,
	options: { includeAutofixPlan?: boolean } = {},
): void {
	const targetRef = target?.trim() || "<target>";
	const spine = [
		`re_verifier matrix ${targetRef}`,
		`re_compiler draft ${targetRef}`,
		`re_replayer run ${targetRef} 1`,
		...(options.includeAutofixPlan ? [`re_autofix plan ${targetRef}`] : []),
	];
	for (const command of spine) {
		if (!commands.includes(command)) commands.push(command);
	}
}
