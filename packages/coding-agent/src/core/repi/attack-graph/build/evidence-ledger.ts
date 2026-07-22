/** Attack-graph build section: evidence ledger. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendAttackGraphEvidenceRecords } from "./evidence-ledger-records.ts";
import { appendAttackGraphEvidenceSeed } from "./evidence-ledger-seed.ts";

export function appendAttackGraphEvidenceLedger(ctx: AttackGraphBuildCtx): void {
	appendAttackGraphEvidenceSeed(ctx);
	appendAttackGraphEvidenceRecords(ctx);
}
