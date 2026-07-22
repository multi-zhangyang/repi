export type StructuredClaimMergeV1 = {
	kind: "StructuredClaimMergeV1";
	schemaVersion: 1;
	mergeId: string;
	sourcePoolId: string;
	target?: string;
	claimRows: StructuredClaimRowV1[];
	conflictTable: {
		conflictId: string;
		claimIds: string[];
		topic: string;
		status: "resolved" | "unresolved";
		winnerClaimId?: string;
		winningEvidenceRefs: string[];
		downgradeLosers: string[];
		resolutionReason?: string;
	}[];
	promotionCheck: {
		mode: "strict_final_claim_promotion";
		requiredStatuses: ["proven"];
		finalClaims: {
			claimId: string;
			promotion: "final_pass";
			reportSection: string;
			verifierPass: boolean;
			artifactRefs: StructuredClaimArtifactRefV1[];
		}[];
		blockedClaims: {
			claimId: string;
			reason: string;
		}[];
		policies: string[];
	};
};

export type StructuredClaimRowV1 = {
	claimId: string;
	workerId: string;
	mergeKey: string;
	status: "proven" | "gap" | "contradicted" | "pending";
	statement: string;
	artifactRefs: StructuredClaimArtifactRefV1[];
	challenges: {
		challengeId: string;
		status: "open" | "resolved";
		resolution?: string;
	}[];
};

export type StructuredClaimArtifactRefV1 = {
	artifactId: string;
	path: string;
	sha256: string;
	jsonQuery: string;
	op: "==" | "contains" | "includes_all";
	expected: unknown;
	verifierPass: boolean;
};

export type StructuredClaimMergeCheckSnapshot = {
	status: "pass" | "blocked" | "missing";
	mergePath?: string;
	mergeId?: string;
	finalClaimCount: number;
	blockedClaimCount: number;
	errors: string[];
	policies: string[];
};

export type StructuredClaimMergeDeps = {
	[key: string]: any;
	buildSwarmRuntimeClaimLedger: (...args: any[]) => any;
	swarmClaimLedgerHashChainOk: (...args: any[]) => any;
	swarmStructuredClaimMergePath: (...args: any[]) => any;

	structuredClaimMergeCheckFromSwarm?: (...args: any[]) => any;
};

let structuredClaimMergeDeps: StructuredClaimMergeDeps | null = null;

export function configureStructuredClaimMerge(deps: StructuredClaimMergeDeps): void {
	structuredClaimMergeDeps = deps;
}

function d(): StructuredClaimMergeDeps {
	if (!structuredClaimMergeDeps)
		throw new Error(
			"structured-claim-merge not configured; call configureStructuredClaimMerge() from REPI kernel init",
		);
	return structuredClaimMergeDeps;
}

export function buildSwarmRuntimeClaimLedger(...args: any[]): any {
	return d().buildSwarmRuntimeClaimLedger(...args);
}
export function swarmClaimLedgerHashChainOk(...args: any[]): any {
	return d().swarmClaimLedgerHashChainOk(...args);
}
export function swarmStructuredClaimMergePath(...args: any[]): any {
	return d().swarmStructuredClaimMergePath(...args);
}
