/** Append challenge/resolution events for a worker claim (reverse-aware). */
// Landmark: workerClaimReverseNextCommand evaluateWorkerClaimReverseGate (via challenge)
// Landmark: missingCoverageRows handled in worker-claims-challenge when claim blocked.

import { appendSwarmClaimLedgerEvent } from "./pure.ts";
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import { appendWorkerClaimChallengeIfBlocked } from "./worker-claims-challenge.ts";
import type { WorkerClaimContext } from "./worker-claims-context.ts";

export function appendWorkerClaimResolutionEvents(input: {
	events: SwarmClaimLedgerEventV1[];
	swarm: SwarmClaimLedgerInput;
	worker: any;
	scope: string;
	timestamp: string;
	ctx: WorkerClaimContext;
}): void {
	const { events, swarm, worker, scope, timestamp, ctx } = input;
	const { runtimeManifests, runtimeManifestRefs, coverageRows, auditRows, claimPassed: _claimPassed, claimId } = ctx;
	if (appendWorkerClaimChallengeIfBlocked({ events, swarm, worker, scope, timestamp, ctx })) {
		return;
	}
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "challenge",
			claimId,
			workerId: worker.id,
			role: "adversary",
			scope,
			status: "accepted",
			challenge: "passed worker claim receives adversarial challenge before promotion.",
			evidenceRefs: [swarm.delegationArtifact, ...worker.sourceArtifacts, ...runtimeManifestRefs].filter(
				(item): item is string => Boolean(item),
			),
			metadata: {
				auditRows,
				coverageRows,
				runtimeManifestFiles: runtimeManifests.map((manifest: any) => manifest.runtimeManifestFile),
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
			role: "supervisor",
			scope,
			status: "accepted",
			resolution:
				"passed worker claim remains eligible for final promotion only after strict claim checkpoint and structured merge.",
			evidenceRefs: [
				swarm.claimLedgerPath,
				...runtimeManifestRefs,
				"check:claim-release",
				"re_supervisor review",
			].filter((item): item is string => Boolean(item)),
			metadata: {
				strictFinalPromotion: "requires StructuredClaimMergeV1 and claim checkpoint pass",
			},
		},
		timestamp,
	);
}
