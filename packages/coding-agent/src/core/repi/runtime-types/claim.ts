/** Runtime types: claim. */

export type StructuredClaimMergeCheckSnapshot = {
	status: "pass" | "blocked" | "missing";
	mergePath?: string;
	mergeId?: string;
	finalClaimCount: number;
	blockedClaimCount: number;
	errors: string[];
	policies: string[];
};

export type SupervisorVerdict = "pass" | "watch" | "repair" | "blocked";

export type ClaimReleaseGap = {
	claimId?: string;
	scope?: string;
	checkpoint?: string;
	kind?: string;
};

export type ClaimReleaseMarker = {
	kind?: string;
	generatedAt?: string;
	mode?: string;
	ok?: boolean;
	root?: string;
	markerPath?: string;
	sourceSha256?: string;
	// opt #186: the evidence ledger is tail-truncated via `.slice(-12000)` before
	// hashing (see writeLocalClaimReleaseMarker). Two runs whose ledgers differ
	// only in the dropped head → same hash (false match); a new tail entry
	// shifting an old one across the 12000 boundary → different hashes (false
	// diff) with no way for a verifier to distinguish. Recording the truncation
	// metadata makes the truncation VISIBLE to consumers: a verifier can compare
	// originalChars vs keptChars to know whether the head was dropped.
	sourceTruncated?: {
		ledger: boolean;
		keptChars: number;
		originalChars: number;
	};
	platformRequiredScore?: number;
	orchestrationScore?: number;
	requiredGaps?: ClaimReleaseGap[];
	checks?: {
		checkAndScores?: {
			status?: string;
			platformRequiredScore?: number;
			orchestrationScore?: number;
			requiredGaps?: ClaimReleaseGap[];
		};
	};
};

export type StrictClaimCheckSnapshot = {
	status: "pass" | "blocked" | "missing";
	markerPath?: string;
	generatedAt?: string;
	mode?: string;
	requiredGaps: string[];
	platformRequiredScore?: number;
	orchestrationScore?: number;
	claimCheckResult: string[];
};
