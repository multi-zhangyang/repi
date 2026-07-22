/** Completion audit base: mission/evidence/reverse/context gates. */
import { buildDomainProofExitClosure } from "../domain-proof-exit.ts";
import { auditCompletionContextGates } from "./audit-base-context.ts";
import { auditCompletionEvidenceGates } from "./audit-base-evidence.ts";

export function auditCompletionBase(): {
	mission: any;
	blockers: string[];
	warnings: string[];
	reverseSignals: any;
	hasProofExit: boolean;
	domainProofExitClosure?: any;
} {
	const evidence = auditCompletionEvidenceGates();
	if (evidence.earlyReturn) return evidence.earlyReturn as any;
	const { mission, blockers, warnings, reverseSignals, hasProofExit } = evidence;
	auditCompletionContextGates(blockers, warnings);
	const _domainProofExitClosure = buildDomainProofExitClosure(mission);
	// domain proof evaluated later in claims phase; keep raw for align
	return { mission, blockers, warnings, reverseSignals, hasProofExit, domainProofExitClosure: undefined as any };
}
