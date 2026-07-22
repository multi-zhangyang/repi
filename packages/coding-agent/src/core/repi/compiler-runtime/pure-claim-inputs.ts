/** Latest compiler claim-check input assembly. */

import { parseSwarmArtifact } from "../graph-artifacts.ts";
import type { StrictClaimCheckSnapshot, StructuredClaimMergeCheckSnapshot } from "../runtime-types/claim.ts";
import { structuredClaimMergeCheckFromSwarm } from "../structured-claim-merge/build-check.ts";
import { latestOrBuildSupervisor } from "../supervisor/io-latest.ts";
import type { SupervisorArtifact } from "../supervisor/types.ts";
import { latestSwarmArtifactPath } from "../swarm-runtime.ts";

type SwarmArtifact = any;

export function latestCompilerClaimCheckInputs(options: { target?: string } = {}): {
	supervisor?: SupervisorArtifact;
	supervisorPath?: string;
	swarm?: SwarmArtifact;
	swarmPath?: string;
	releaseCheckMetadata: string[];
	claimCheckPolicy: string[];
	strictClaimCheck: StrictClaimCheckSnapshot;
	claimCheckResult: string[];
	structuredClaimMergeCheck: StructuredClaimMergeCheckSnapshot;
} {
	let supervisor: SupervisorArtifact | undefined;
	let supervisorPath: string | undefined;
	let swarm: SwarmArtifact | undefined;
	let swarmPath: string | undefined;
	try {
		const built = latestOrBuildSupervisor({ target: options.target });
		supervisor = (built as any)?.supervisor ?? (built as any);
		supervisorPath = (built as any)?.path ?? (built as any)?.supervisorPath;
	} catch {
		// optional when supervisor not configured
	}
	try {
		swarmPath = (latestSwarmArtifactPath as any)({ target: options.target }) ?? (latestSwarmArtifactPath as any)();
		if (swarmPath) swarm = parseSwarmArtifact(swarmPath) as any;
	} catch {
		// optional
	}
	const releaseCheckMetadata = ((supervisor as any)?.releaseCheckMetadata ??
		(swarm as any)?.releaseCheckMetadata ??
		[]) as string[];
	const claimCheckPolicy = ((supervisor as any)?.claimCheckPolicy ?? []) as string[];
	const strictClaimCheck: StrictClaimCheckSnapshot =
		((supervisor as any)?.strictClaimCheck as StrictClaimCheckSnapshot | undefined) ??
		({
			status: "missing",
			requiredGaps: ["strict_claim_release_marker_missing"],
			claimCheckResult: ["strict_claim_check.status=missing"],
		} as StrictClaimCheckSnapshot);
	const claimCheckResult = ((supervisor as any)?.claimCheckResult as string[] | undefined) ?? [
		`strict_claim_check.status=${strictClaimCheck.status}`,
		...(strictClaimCheck.requiredGaps ?? []).map((g: any) => `required_gap=${g}`),
	];
	let structuredClaimMergeCheck: StructuredClaimMergeCheckSnapshot = {
		status: "missing",
		finalClaimCount: 0,
		blockedClaimCount: 0,
		errors: ["structured_claim_merge_missing"],
		policies: [],
	};
	try {
		if (swarm) structuredClaimMergeCheck = structuredClaimMergeCheckFromSwarm(swarm as any);
	} catch {
		// optional
	}
	return {
		supervisor,
		supervisorPath,
		swarm,
		swarmPath,
		releaseCheckMetadata,
		claimCheckPolicy,
		strictClaimCheck,
		claimCheckResult,
		structuredClaimMergeCheck,
	};
}
