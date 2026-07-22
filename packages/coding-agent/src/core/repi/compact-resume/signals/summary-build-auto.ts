/** Compaction auto-resume builder. */

export function buildReconCompactionAutoResume(contract: any, triggered: boolean, reason: string): any {
	return {
		kind: "repi-compaction-auto-resume",
		version: 1,
		timestamp: new Date().toISOString(),
		triggered,
		reason,
		compactionEntryId: contract.compactionEntryId,
		contextPath: contract.contextPath,
		resumeCommands: contract.nextCommands.slice(0, 8),
		contractVerified: contract.verified,
	};
}
