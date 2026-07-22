/** Failure signature/category pure classification + reverse next. */

import { reverseFailureNextCommands } from "./classify-reverse.ts";

export { runtimeFailureCategory, runtimeFailureSignature } from "./classify-pure-core.ts";
export { reverseFailureNextCommands } from "./classify-reverse.ts";

import type { FailureLedgerEventV1, RepairQueueItemV1, RuntimeRepairAction } from "./types.ts";

export function isFailureLedgerEvent(row: unknown): row is FailureLedgerEventV1 {
	if (typeof row !== "object" || row === null) return false;
	const r = row as Record<string, unknown>;
	const budget = r.budget;
	return (
		typeof r.id === "string" &&
		r.id.length > 0 &&
		typeof r.signature === "string" &&
		r.signature.length > 0 &&
		typeof r.ts === "string" &&
		typeof r.attempt === "number" &&
		typeof r.maxAttempts === "number" &&
		typeof r.status === "string" &&
		typeof budget === "object" &&
		budget !== null &&
		typeof (budget as Record<string, unknown>).remainingAttempts === "number" &&
		Array.isArray(r.failedChecks)
	);
}

export function isRepairQueueItem(row: unknown): row is RepairQueueItemV1 {
	if (typeof row !== "object" || row === null) return false;
	const r = row as Record<string, unknown>;
	return (
		typeof r.repairId === "string" &&
		r.repairId.length > 0 &&
		typeof r.signature === "string" &&
		r.signature.length > 0 &&
		typeof r.action === "string" &&
		typeof r.paused === "boolean" &&
		Array.isArray(r.commands) &&
		Array.isArray(r.expectedChecks)
	);
}

export function failureToRepair(
	failure: FailureLedgerEventV1,
	commands: string[],
	action: RuntimeRepairAction,
	expectedChecks: string[],
	expectedArtifacts: string[],
): RepairQueueItemV1 {
	const paused = commands.some((command: any) =>
		/\b(?:live|provider|model|api[_-]?key|secret|token)\b/i.test(command),
	);
	return {
		repairId: failure.repairId,
		fromFailureId: failure.id,
		signature: failure.signature,
		scope: failure.scope,
		action,
		repairAction: action,
		commands: Array.from(
			new Set([...commands, ...reverseFailureNextCommands(`${failure.category} ${failure.signature}`)]),
		).slice(0, 12),
		expectedArtifacts: Array.from(new Set(expectedArtifacts.filter(Boolean))).slice(0, 24),
		expectedChecks,
		preconditions: {
			liveAllowed: false,
			providerAllowed: false,
			requiredSecrets: [],
		},
		paused,
		allowlist: failure.rollback.allowlist,
		rollbackCriteria: {
			baseline: failure.rollback.baseline,
			mustRestore: failure.rollback.allowlist,
			verificationCommand: "re_proof_loop run <target> 4 2",
		},
		blockedConditions: failure.blockedConditions,
		evidenceWriteback: failure.evidenceWriteback,
		regressionChecks: Array.from(new Set(["verifier_matrix_ready", ...expectedChecks])).slice(0, 8),
	};
}

/** reverse: contract_gap reverse markers seed domain capture next commands */
