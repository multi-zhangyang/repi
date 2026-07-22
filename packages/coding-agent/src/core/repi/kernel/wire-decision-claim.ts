/** Wire-decision: configureStructuredClaimMerge bag. */

import { structuredClaimMergeCheckFromSwarm } from "../structured-claim-merge/build.ts";
import { configureStructuredClaimMerge } from "../structured-claim-merge.ts";
import { swarmClaimLedgerHashChainOk } from "../swarm-claim-ledger/pure.ts";
import { buildSwarmRuntimeClaimLedger } from "../swarm-claim-ledger.ts";
import { swarmStructuredClaimMergePath } from "../swarm-runtime/paths.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireStructuredClaimConfigure(pick: PickFn): void {
	configureStructuredClaimMerge({
		buildSwarmRuntimeClaimLedger: pick("buildSwarmRuntimeClaimLedger", buildSwarmRuntimeClaimLedger),
		structuredClaimMergeCheckFromSwarm: pick(
			"structuredClaimMergeCheckFromSwarm",
			structuredClaimMergeCheckFromSwarm,
		),
		swarmClaimLedgerHashChainOk: pick("swarmClaimLedgerHashChainOk", swarmClaimLedgerHashChainOk),
		swarmStructuredClaimMergePath: pick("swarmStructuredClaimMergePath", swarmStructuredClaimMergePath),
	});
}
