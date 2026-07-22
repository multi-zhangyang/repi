/** Repair rollback policy types + stableJson. */

import type { RuntimeRepairAction } from "./failure-repair/types.ts";
import type { FailureRepairEvidenceWriteback } from "./runtime-types/failure.ts";
import type { FailureLedgerEventV1, RuntimeFailureSource } from "./runtime-types.ts";

export type RepairRollbackPolicyV1 = {
	kind: "RepairRollbackPolicyV1";
	schemaVersion: 1;
	generatedAt: string;
	source: RuntimeFailureSource | "compound-frontier" | "provider-worker";
	workspace: string;
	baseline: {
		command: string;
		treeSha256: string;
		files: Array<{ path: string; bytes: number; sha256: string }>;
	};
	allowlist: string[];
	repair: {
		commands: string[];
		changedFiles: string[];
		expectedArtifacts: string[];
		regressionChecks: string[];
	};
	rollback: {
		required: true;
		commands: string[];
		restored: boolean;
		restoredTreeSha256: string;
		criteria: string[];
	};
	regression: {
		before: "pass" | "fail" | "skipped";
		after: "pass" | "fail" | "skipped";
		restored: "pass" | "fail" | "skipped";
		checkpoints: Array<{
			checkId: string;
			command: string;
			status: "pass" | "fail" | "skipped";
			artifactPath?: string;
			artifactSha256?: string;
		}>;
	};
	failureLedgerEvents: FailureLedgerEventV1[];
	repairQueue: RepairQueueItemV1[];
	failureRepairValidation: { ok: boolean; failureCount: number; repairCount: number };
	assertions: {
		baselineCaptured: boolean;
		allowlistEnforced: boolean;
		rollbackRestored: boolean;
		regressionChecksPassed: boolean;
		noUnrelatedFileChanges: boolean;
		failureRepairLinked: boolean;
	};
};

export type RepairQueueItemV1 = {
	repairId: string;
	fromFailureId: string;
	signature: string;
	scope: string;
	action: RuntimeRepairAction;
	repairAction: RuntimeRepairAction;
	commands: string[];
	expectedArtifacts: string[];
	expectedChecks: string[];
	preconditions: { liveAllowed: boolean; providerAllowed: boolean; requiredSecrets: string[] };
	paused: boolean;
	allowlist: string[];
	rollbackCriteria: { baseline: string; mustRestore: string[]; verificationCommand: string };
	blockedConditions: Array<{ reason: string; unblock: string }>;
	evidenceWriteback: FailureRepairEvidenceWriteback;
	regressionChecks: string[];
};

export function stableJson(value: unknown): string {
	return JSON.stringify(value, (_key, item) => {
		if (!item || typeof item !== "object" || Array.isArray(item)) return item;
		return Object.keys(item as Record<string, unknown>)
			.sort()
			.reduce<Record<string, unknown>>((out, key) => {
				out[key] = (item as Record<string, unknown>)[key];
				return out;
			}, {});
	});
}

export type RepairRollbackDeps = {
	buildRuntimeFailureRepair: (...args: any[]) => any;
};

const _repairRollbackDeps: RepairRollbackDeps | null = null;
