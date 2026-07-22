/** Swarm claim ledger collision + final-promotion challenge events. */
import { createHash } from "node:crypto";
import { appendSwarmClaimLedgerEvent } from "./pure.ts";
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";

export function appendSwarmCollisionChallengeEvents(
	events: SwarmClaimLedgerEventV1[],
	swarm: SwarmClaimLedgerInput,
	planId: string,
	scope: string,
	timestamp: string,
): void {
	for (const collision of (swarm.collisionMatrix as any[]) ?? []) {
		const claimId = `${planId}:collision:${createHash("sha256").update(collision).digest("hex").slice(0, 12)}`;
		appendSwarmClaimLedgerEvent(
			events,
			{
				type: "challenge",
				claimId,
				workerId: "collision_matrix",
				role: "adversary",
				scope,
				status: "blocked",
				challenge: `merge conflict requires supervisor arbitration: ${collision}`,
				evidenceRefs: [swarm.delegationArtifact, ...swarm.sourceArtifacts].filter((item): item is string =>
					Boolean(item),
				),
			},
			timestamp,
		);
		appendSwarmClaimLedgerEvent(
			events,
			{
				type: "resolution",
				claimId,
				workerId: "collision_matrix",
				role: "supervisor",
				scope,
				status: "queued_repair",
				resolution:
					"collision is preserved for re_supervisor review; final claim promotion is blocked until conflict is resolved.",
				evidenceRefs: [swarm.claimLedgerPath, "re_supervisor review"].filter((item): item is string =>
					Boolean(item),
				),
			},
			timestamp,
		);
	}
	if (!events.some((event: any) => event.type === "challenge")) {
		appendSwarmClaimLedgerEvent(
			events,
			{
				type: "challenge",
				claimId: `${planId}:final_promotion_policy`,
				workerId: "re_swarm",
				role: "adversary",
				scope,
				status: "accepted",
				challenge:
					"no unresolved worker challenge in this swarm artifact; retain final-promotion adversary checkpoint.",
				evidenceRefs: [swarm.claimLedgerPath, swarm.delegationArtifact].filter((item): item is string =>
					Boolean(item),
				),
			},
			timestamp,
		);
		appendSwarmClaimLedgerEvent(
			events,
			{
				type: "resolution",
				claimId: `${planId}:final_promotion_policy`,
				workerId: "re_swarm",
				role: "supervisor",
				scope,
				status: "accepted",
				resolution:
					"role claims may only promote after supervisor claimCheckPolicy, reverse runtime proof.exit/bind_ready, and strict claim marker pass.",
				evidenceRefs: [
					swarm.claimLedgerPath,
					"check:claim-release",
					"re_supervisor review",
					"re_domain_proof_exit show",
				].filter((item): item is string => Boolean(item)),
			},
			timestamp,
		);
	}
}
