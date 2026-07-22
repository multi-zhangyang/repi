/** Process one swarm worker claim event (reverse merge gate). */
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import { appendWorkerClaimBaselineEvents } from "./worker-claims-baseline.ts";
import { buildWorkerClaimContext } from "./worker-claims-context.ts";
import { appendWorkerClaimResolutionEvents } from "./worker-claims-resolution.ts";

export function appendOneSwarmWorkerClaimEvents(
	events: SwarmClaimLedgerEventV1[],
	swarm: SwarmClaimLedgerInput,
	worker: any,
	planId: string,
	scope: string,
	timestamp: string,
): void {
	const ctx = buildWorkerClaimContext({ swarm, worker, planId });
	appendWorkerClaimBaselineEvents({ events, swarm, worker, scope, timestamp, ctx });
	appendWorkerClaimResolutionEvents({ events, swarm, worker, scope, timestamp, ctx });
}
