/** Build structured claim merge with reverse promotion gates. */
import { createHash } from "node:crypto";
import { filterStructuredClaimPromotion } from "./build-merge-reverse.ts";
import type { StructuredClaimMergeV1, StructuredClaimRowV1 } from "./deps.ts";
import {
	claimPromotionEvidenceContract,
	resolveStructuredClaimConflict,
	structuredClaimArtifactRefsFromLedgerEvent,
	structuredClaimStatusFromLedger,
} from "./pure.ts";

export function buildStructuredClaimMergeFromSwarm(swarm: any): StructuredClaimMergeV1 {
	const claimLedger = swarm.claimLedger ?? [];
	const planId = swarm.parallelPlan?.planId ?? `re_swarm:${swarm.timestamp}`;
	const claimEvents = claimLedger.filter((event: any) => event.type === "claim" && Boolean(event.claimId));
	const validationByClaim = new Map(
		claimLedger
			.filter((event: any) => event.type === "validation" && Boolean(event.claimId))
			.map((event: any) => [event.claimId as string, event]),
	);
	const challengesByClaim = new Map<string, any[]>();
	const resolutionsByClaim = new Map<string, any[]>();
	for (const event of claimLedger) {
		if (!event.claimId) continue;
		if (event.type === "challenge")
			challengesByClaim.set(event.claimId, [...(challengesByClaim.get(event.claimId) ?? []), event]);
		if (event.type === "resolution")
			resolutionsByClaim.set(event.claimId, [...(resolutionsByClaim.get(event.claimId) ?? []), event]);
	}
	const claimRows: StructuredClaimRowV1[] = claimEvents.map((event: any) => {
		const validation = validationByClaim.get(event.claimId as string);
		const resolutionRows = resolutionsByClaim.get(event.claimId as string) ?? [];
		const artifactRefs = structuredClaimArtifactRefsFromLedgerEvent(event);
		return {
			claimId: event.claimId as string,
			workerId: event.workerId ?? "re_swarm",
			mergeKey: `${event.scope ?? swarm.target ?? swarm.route ?? "re_swarm"}:${event.workerId ?? "worker"}`,
			status:
				(validation as any)?.status === "pass" && (event as any).status === "proven" && artifactRefs.length > 0
					? "proven"
					: structuredClaimStatusFromLedger((event as any).status),
			statement: event.statement ?? "worker claim missing statement",
			artifactRefs,
			challenges: (challengesByClaim.get(event.claimId as string) ?? []).map((challenge: any, index: any) => {
				const resolution = resolutionRows[index] ?? resolutionRows[0];
				const resolved = Boolean(
					resolution && ((resolution as any).status === "accepted" || (resolution as any).status === "pass"),
				);
				return {
					challengeId: `${challenge.claimId}:challenge:${index + 1}`,
					status: resolved ? "resolved" : "open",
					resolution: resolution?.resolution,
				};
			}),
		};
	});
	const provenIds = new Set(
		claimRows.filter((claim: any) => (claim as any).status === "proven").map((claim: any) => claim.claimId),
	);
	const conflictTable: StructuredClaimMergeV1["conflictTable"] = (swarm.collisionMatrix ?? [])
		.filter(() => claimRows.length > 1)
		.map((collision: any, index: any) => resolveStructuredClaimConflict(collision, index, claimRows, swarm));
	const conflictLoserIds = new Set(conflictTable.flatMap((conflict: any) => conflict.downgradeLosers));
	const conflictWinnerIds = new Set(
		conflictTable.map((conflict: any) => conflict.winnerClaimId).filter((item): item is string => Boolean(item)),
	);
	const { finalClaims, blockedClaims } = filterStructuredClaimPromotion(
		claimRows,
		provenIds,
		conflictLoserIds,
		conflictWinnerIds,
		conflictTable.length,
	);
	return {
		kind: "StructuredClaimMergeV1",
		schemaVersion: 1,
		mergeId: `structured-claim-merge:${planId}:${createHash("sha256")
			.update(JSON.stringify(claimLedger.map((event: any) => event.eventHash)))
			.digest("hex")
			.slice(0, 16)}`,
		sourcePoolId: planId,
		target: swarm.target,
		claimRows,
		conflictTable,
		promotionCheck: {
			mode: "strict_final_claim_promotion",
			requiredStatuses: ["proven"],
			finalClaims: finalClaims as any,
			blockedClaims,
			policies: claimPromotionEvidenceContract(),
		},
	};
}
