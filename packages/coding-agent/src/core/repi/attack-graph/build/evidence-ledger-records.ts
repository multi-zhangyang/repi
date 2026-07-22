/** Process evidence ledger task records into attack-graph nodes/tasks/edges. */

import { parseEvidenceLedgerTaskRecords } from "../evidence.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendEvidenceLedgerRecordCore } from "./evidence-ledger-records-core.ts";
import { appendEvidenceLedgerRecordHypothesis } from "./evidence-ledger-records-hypothesis.ts";

export function appendAttackGraphEvidenceRecords(ctx: AttackGraphBuildCtx): void {
	const openEvidenceHypotheses: string[] = [];
	for (const record of parseEvidenceLedgerTaskRecords()) {
		const { commandOutputId } = appendEvidenceLedgerRecordCore(ctx, record);
		appendEvidenceLedgerRecordHypothesis(ctx, record, {
			commandOutputId,
			openEvidenceHypotheses,
		});
	}
}
