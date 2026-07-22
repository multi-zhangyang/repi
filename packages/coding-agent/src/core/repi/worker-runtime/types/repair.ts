/** Worker-runtime types: repair. */
export type RepiFailureRepairArtifactHash = {
	path: string;
	sha256: string;
	tier: string;
};

export type RepiRepairRollbackPolicyV1 = {
	kind: "RepairRollbackPolicyV1";
	schemaVersion: 1;
	baseline: { treeSha256: string; files: unknown[] };
	allowlist: string[];
	repair: { changedFiles: string[] };
	rollback: { required: boolean; restored: boolean; restoredTreeSha256: string };
	regression: {
		after: string;
		restored: string;
		checkpoints: Array<{ checkId: string; status: string }>;
	};
	failureLedgerEvents: unknown[];
	repairQueue: Array<{ action: string; rollbackCriteria: { mustRestore: string[] } }>;
	failureRepairValidation: { ok: boolean };
	assertions: {
		baselineCaptured: boolean;
		allowlistEnforced: boolean;
		rollbackRestored: boolean;
		regressionChecksPassed: boolean;
		noUnrelatedFileChanges: boolean;
		failureRepairLinked: boolean;
	};
};
