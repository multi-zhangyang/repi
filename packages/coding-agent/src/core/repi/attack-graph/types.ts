/** Attack-graph local types. */
export type EvidenceLedgerTaskRecord = {
	index: number;
	evidenceId: string;
	timestamp: string;
	priority: number;
	kind: string;
	title: string;
	fact?: string;
	command?: string;
	path?: string;
	hash?: string;
	verify?: string;
	confidence?: string;
	/** Queryable reverse fields parsed from ledger `- query.k: v` lines. */
	query?: Record<string, string>;
	/** Meta tags parsed from ledger `- meta: ...` lines. */
	meta?: string[];
};
