/** Proof-loop gap classifier format/order helpers. */
import { truncateMiddle } from "../text.ts";
import { classifyRepiProofLoopGap } from "./classify-core.ts";
import type {
	RepiProofLoopDelegateWorker,
	RepiProofLoopGapClass,
	RepiProofLoopGapItem,
	RepiProofLoopGapSource,
	RepiProofLoopQuickPlanV1,
} from "./types.ts";

export function formatRepiProofLoopGapClassifier(items: RepiProofLoopGapItem[]): string[] {
	return items
		.map((item: any, index: any) => {
			const classified = classifyRepiProofLoopGap(item);
			return `priority=${classified.priority} class=${classified.klass} worker=${item.worker} source=${item.source} gap=${index + 1} action="${classified.action}" evidence=${item.sourceArtifacts.slice(0, 3).join(" | ") || "none"} :: ${truncateMiddle(item.text, 520)}`;
		})
		.sort((left: any, right: any) => {
			const leftPriority = Number(/priority=(\d+)/.exec(left)?.[1] ?? "9");
			const rightPriority = Number(/priority=(\d+)/.exec(right)?.[1] ?? "9");
			return leftPriority - rightPriority || left.localeCompare(right);
		})
		.slice(0, 24);
}

export function repiProofLoopClassOrderFromItems(
	items: RepiProofLoopGapItem[],
): RepiProofLoopQuickPlanV1["classOrder"] {
	const rows = new Map<
		RepiProofLoopGapClass,
		{
			klass: RepiProofLoopGapClass;
			priority: number;
			count: number;
			workers: Set<RepiProofLoopDelegateWorker>;
			sources: Set<RepiProofLoopGapSource>;
		}
	>();
	for (const item of items) {
		const classified = classifyRepiProofLoopGap(item);
		const row = rows.get(classified.klass) ?? {
			klass: classified.klass,
			priority: classified.priority,
			count: 0,
			workers: new Set<RepiProofLoopDelegateWorker>(),
			sources: new Set<RepiProofLoopGapSource>(),
		};
		row.count += 1;
		row.priority = Math.min(row.priority, classified.priority);
		row.workers.add(item.worker);
		row.sources.add(item.source);
		rows.set(classified.klass, row);
	}
	return Array.from(rows.values())
		.map((row: any) => ({
			klass: row.klass,
			priority: row.priority,
			count: row.count,
			workers: Array.from(row.workers).sort(),
			sources: Array.from(row.sources).sort(),
		}))
		.sort((left: any, right: any) => left.priority - right.priority || left.klass.localeCompare(right.klass)) as any;
}
