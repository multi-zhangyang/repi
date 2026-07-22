/** Attack graph task-tree prioritization. */
import type { AttackGraphTaskTreeNode } from "./types.ts";

export function taskTreeRetentionScore(node: AttackGraphTaskTreeNode): number {
	const status = node.status ?? "";
	const text = `${node.kind}\n${node.label}\n${status}\n${node.note ?? ""}\n${node.evidence?.join("\n") ?? ""}`;
	let score =
		node.kind === "mission" || node.kind === "route"
			? 1_000
			: node.kind === "gap" || node.kind === "counter_evidence"
				? 950
				: node.kind === "verification" || node.kind === "parser_summary"
					? 850
					: node.kind === "hypothesis"
						? 780
						: node.kind === "artifact"
							? 720
							: node.kind === "evidence"
								? 680
								: node.kind === "command" || node.kind === "run"
									? 620
									: node.kind === "target_profile"
										? 560
										: node.kind === "next"
											? 520
											: 100;
	if (/blocked|missing|failed|failure|killed|no-match|counter|refut|contradict|gap/i.test(text)) score += 240;
	if (/sha256|hash|runtime-output|proof-loop-output|parser_signal_summary|proof_exit|missing_proof/i.test(text))
		score += 160;
	if (
		/binary[- ]mitigation|native-mitigation|pwn-mitigation|GNU_STACK|GNU_RELRO|BIND_NOW|RELRO|NX|PIE|canary|fortify/i.test(
			text,
		)
	)
		score += 180;
	if (/quick_path|re_proof_loop|re_verifier|re_compiler|re_replayer|re_autofix/i.test(text)) score += 90;
	if (node.path) score += 50;
	if (node.command) score += 40;
	if (node.evidence?.length) score += Math.min(80, node.evidence.length * 12);
	if (!node.parentId) score += 30;
	return score;
}

export function prioritizeAttackGraphTaskTree(
	nodes: AttackGraphTaskTreeNode[],
	limit = 160,
): AttackGraphTaskTreeNode[] {
	if (limit <= 0) return [];
	if (nodes.length <= limit) return [...nodes];

	const byId = new Map<string, number>();
	for (const [index, node] of nodes.entries()) {
		if (!byId.has(node.id)) byId.set(node.id, index);
	}

	const selected = new Set<number>();
	const ancestorIndexes = (node: AttackGraphTaskTreeNode): number[] => {
		const chain: number[] = [];
		const seen = new Set<string>();
		let parentId = node.parentId;
		while (parentId && !seen.has(parentId)) {
			seen.add(parentId);
			const parentIndex = byId.get(parentId);
			if (parentIndex === undefined) break;
			chain.push(parentIndex);
			parentId = nodes[parentIndex]?.parentId;
		}
		return chain.reverse();
	};
	const add = (index: number): boolean => {
		if (selected.has(index)) return true;
		if (selected.size >= limit) return false;
		selected.add(index);
		return true;
	};
	const addWithParents = (index: number): void => {
		for (const parentIndex of ancestorIndexes(nodes[index]!)) {
			if (!add(parentIndex)) return;
		}
		add(index);
	};

	const ranked = nodes
		.map((node: any, index: any) => ({ index, score: taskTreeRetentionScore(node) }))
		.sort((left: any, right: any) => right.score - left.score || left.index - right.index);

	for (const { index } of ranked) {
		if (selected.size >= limit) break;
		addWithParents(index);
	}

	return nodes.filter((_node: any, index: any) => selected.has(index));
}
