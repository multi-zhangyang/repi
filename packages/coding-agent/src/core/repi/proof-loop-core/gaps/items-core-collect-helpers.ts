/** Shared collector state for proof-loop gap items. */

import { existsSync } from "node:fs";
import { readCurrentMission } from "../../mission.ts";
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { truncateMiddle } from "../../text.ts";

export function createProofLoopGapCollector(target?: string): {
	targetRef: string | undefined;
	items: Array<Omit<ProofLoopGapItem, "worker">>;
	add: (source: any, text: string | undefined, sourceArtifacts: string[]) => void;
	scope: Record<string, string>;
} {
	const mission = readCurrentMission();
	const targetRef = target ?? mission?.task;
	const items: Array<Omit<ProofLoopGapItem, "worker">> = [];
	const add = (source: any, text: string | undefined, sourceArtifacts: string[]) => {
		const normalized = text?.replace(/\s+/g, " ").trim();
		if (!normalized) return;
		items.push({
			source,
			text: truncateMiddle(normalized, 520),
			sourceArtifacts: Array.from(new Set(sourceArtifacts.filter((path: any) => existsSync(path)))).slice(0, 16),
		});
	};
	const scope: Record<string, string> = targetRef
		? { target: targetRef, requestedBy: "proof_loop_gap_latest_artifact_consumer" }
		: {};
	return { targetRef, items, add, scope };
}
