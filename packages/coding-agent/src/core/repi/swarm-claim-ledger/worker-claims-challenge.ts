/** Worker claim challenge event when claim not passed. */

import { truncateMiddle } from "../text.ts";
import { appendSwarmClaimLedgerEvent } from "./pure.ts";
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import type { WorkerClaimContext } from "./worker-claims-context.ts";
import {
	workerClaimReverseBlockReason,
	workerClaimReverseGateMeta,
	workerClaimReverseNextCommand,
} from "./worker-claims-reverse.ts";

export function appendWorkerClaimChallengeIfBlocked(input: {
	events: SwarmClaimLedgerEventV1[];
	swarm: SwarmClaimLedgerInput;
	worker: any;
	scope: string;
	timestamp: string;
	ctx: WorkerClaimContext;
}): boolean {
	const { events, swarm, worker, scope, timestamp, ctx } = input;
	const { executions, runtimeManifestRefs, blocked, missingCoverageRows, reverseGate, claimId, claimPassed } = ctx;
	if (claimPassed) return false;
	const reverseReason = workerClaimReverseBlockReason(reverseGate);
	const reason = reverseReason
		? reverseReason
		: executions.length === 0
			? "pending_execution"
			: blocked.length
				? "blocked_execution"
				: "missing_evidence_contract";
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "challenge",
			claimId,
			workerId: worker.id,
			role: "adversary",
			scope,
			status: "blocked",
			challenge: `worker claim challenged: ${reason}`,
			evidenceRefs: [swarm.delegationArtifact, ...worker.sourceArtifacts, ...runtimeManifestRefs].filter(
				(item): item is string => Boolean(item),
			),
			metadata: {
				reason,
				blockedRows: blocked.map((execution: any) => truncateMiddle(execution.output.replace(/\s+/g, " "), 240)),
				missingCoverageRows,
			},
		},
		timestamp,
	);
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "resolution",
			claimId,
			workerId: worker.id,
			role: "re_swarm",
			scope,
			status: "queued_repair",
			resolution: "claim remains downgraded; retryQueue and supervisor repair must close before final promotion.",
			evidenceRefs: [swarm.claimLedgerPath, ...((swarm.retryQueue as any[]) ?? [])].filter((item): item is string =>
				Boolean(item),
			),
			metadata: {
				retryQueue: ((swarm.retryQueue as any[]) ?? []).filter((row: any) => row.includes(`worker=${worker.id}`)),
				next: reverseGate.blocked
					? workerClaimReverseNextCommand(reverseGate, swarm.target)
					: `re_swarm run ${swarm.target ?? "<target>"} 1 1 && re_supervisor repair ${swarm.target ?? "<target>"}`,
				reverseGate: workerClaimReverseGateMeta(reverseGate),
			},
		},
		timestamp,
	);
	return true;
}
