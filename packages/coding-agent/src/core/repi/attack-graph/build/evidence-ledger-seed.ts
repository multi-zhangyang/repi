/** Seed attack-graph nodes from evidence ledger graph nodes. */

import { evidenceLedgerGraphNodes } from "../../evidence.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphEvidenceSeed(ctx: AttackGraphBuildCtx): void {
	for (const node of evidenceLedgerGraphNodes()) {
		ctx.addNode(node);
		if (ctx.mission)
			ctx.addEdge({ from: `mission:${ctx.mission.id}`, to: node.id, kind: "evidences", label: `P${node.priority}` });
	}
}
