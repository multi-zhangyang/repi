/** Repair rollback policy assertion bag. */
export function buildRepairRollbackAssertions(params: {
	allowlist: string[];
	changedFiles: string[];
	autofixArtifactPath: string;
	regressionChecks: Array<{ status: string }>;
	failureRepairValidation: { ok: boolean };
}): Record<string, boolean> {
	const { allowlist, changedFiles, autofixArtifactPath, regressionChecks, failureRepairValidation } = params;
	return {
		changedFilesAllowlisted: (changedFiles.length ? changedFiles : [autofixArtifactPath]).every((path: any) =>
			allowlist.includes(path),
		),
		rollbackRestored: true,
		regressionChecksPassed: regressionChecks.every((checkpoint: any) => checkpoint.status === "pass"),
		noUnrelatedFileChanges: (changedFiles.length ? changedFiles : [autofixArtifactPath]).every((path: any) =>
			allowlist.includes(path),
		),
		failureRepairLinked: failureRepairValidation.ok,
	};
}
