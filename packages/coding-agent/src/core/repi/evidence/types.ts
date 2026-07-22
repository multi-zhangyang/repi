/** Evidence types. */
export type EvidenceKind = "runtime" | "traffic" | "served_asset" | "process_config" | "artifact" | "source" | "note";

export type EvidenceRecord = {
	timestamp: string;
	kind: EvidenceKind;
	priority: number;
	title: string;
	fact: string;
	command?: string;
	path?: string;
	offset?: string;
	hash?: string;
	verify?: string;
	confidence?: string;
	/** Queryable reverse/ledger fields (technique/mitre/cwe/proof_exit/...). */
	query?: Record<string, string>;
	/** Optional free-form metadata tags for reverse/runtime evidence. */
	meta?: string[];
};

export type EvidenceGraphNode = {
	id: string;
	kind: "evidence";
	label: string;
	status?: string;
	priority?: number;
	note?: string;
};

export type EvidenceIoOptions = {
	ensureStorage?: () => void;
	readText?: (path: string, fallback?: string) => string;
	truncate?: (text: string, limit: number) => string;
};

export type AppendEvidenceOptions = EvidenceIoOptions & {
	appendText: (path: string, text: string) => void;
	onLedgerUpdated?: (record: EvidenceRecord) => void;
	now?: () => Date;
};

export type EvidenceRuntimeDeps = {
	updateMissionCheckpoint: (...args: any[]) => any;
};
