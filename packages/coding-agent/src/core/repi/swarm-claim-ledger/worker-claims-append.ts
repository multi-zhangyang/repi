/** Append per-worker swarm claim events (reverse merge gate). */
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import { appendOneSwarmWorkerClaimEvents } from "./worker-claims-append-one.ts";

export function appendSwarmWorkerClaimEvents(
	events: SwarmClaimLedgerEventV1[],
	swarm: SwarmClaimLedgerInput,
	worker: any,
	planId: string,
	scope: string,
	timestamp: string,
): void {
	appendOneSwarmWorkerClaimEvents(events, swarm, worker, planId, scope, timestamp);
}

export { appendOneSwarmWorkerClaimEvents } from "./worker-claims-append-one.ts";
