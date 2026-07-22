/** Refresh swarm runtime claim ledger. */

import { structuredClaimMergeCheckFromSwarm } from "./build.ts";
import { buildStructuredClaimMergeFromSwarm } from "./build-merge.ts";
import { buildSwarmRuntimeClaimLedger, swarmClaimLedgerHashChainOk, swarmStructuredClaimMergePath } from "./deps.ts";

export function refreshSwarmRuntimeClaimLedger(swarm: any): any {
	const claimLedger = buildSwarmRuntimeClaimLedger(swarm);
	const runtimeClaimLedgerCaptured =
		swarmClaimLedgerHashChainOk(claimLedger) &&
		(["artifact_handoff", "claim", "validation", "challenge", "resolution"] as const).every((type: any) =>
			claimLedger.some((event: any) => event.type === type),
		);
	const structuredClaimMergePath = swarm.structuredClaimMergePath ?? swarmStructuredClaimMergePath(swarm);
	const structuredClaimMerge = buildStructuredClaimMergeFromSwarm({ ...swarm, claimLedger, structuredClaimMergePath });
	const structuredClaimMergeCheck = structuredClaimMergeCheckFromSwarm({
		...swarm,
		claimLedger,
		structuredClaimMerge,
		structuredClaimMergePath,
	});
	return {
		...swarm,
		claimLedger,
		claimLedgerEventCount: claimLedger.length,
		claimLedgerTipHash: claimLedger.at(-1)?.eventHash,
		runtimeClaimLedgerCaptured,
		structuredClaimMerge,
		structuredClaimMergePath,
		structuredClaimMergeStatus: structuredClaimMergeCheck.status,
		structuredClaimMergeErrors: structuredClaimMergeCheck.errors,
		sourceArtifacts: Array.from(
			new Set(
				[
					...swarm.sourceArtifacts,
					swarm.claimLedgerPath,
					structuredClaimMergePath,
					swarm.subagentRuntimeManifestPath,
					...(swarm.subagentRuntimeManifests ?? []).flatMap((manifest: any) => [
						manifest.runtimeManifestFile,
						manifest.stdoutPath,
						manifest.stderrPath,
					]),
				].filter((item): item is string => Boolean(item)),
			),
		).slice(0, 64),
	};
}
