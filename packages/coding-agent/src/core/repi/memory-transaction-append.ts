/** Memory transaction append stubs (product-lean). */
import type {
	CaseMemoryV1,
	MemoryAppendTransactionV1,
	MemoryEventInput,
	MemoryEventV1,
} from "./memory-transaction-types.ts";
/**
 * Memory append transaction surface.
 *
 * Long-term memory is out of the product default surface; these entrypoints stay
 * as lean stubs so historical call sites and configure* wiring keep compiling.
 * Real ledger mutation requires REPI_CONTEXT_MEMORY / REPI_FULL_SURFACE opt-in
 * work that is intentionally not reintroduced here.
 */
import { readCurrentMission } from "./mission.ts";

export function configureMemoryTransaction(_deps: Record<string, never> = {}): void {
	// no-op
}

function stubEvent(input: MemoryEventInput): MemoryEventV1 {
	const mission = readCurrentMission();
	const timestamp = new Date().toISOString();
	return {
		kind: "MemoryEventV1",
		schemaVersion: 1,
		timestamp,
		task: String(input.task ?? mission?.task ?? "manual memory"),
		route: input.route ?? mission?.route?.domain,
		target: input.target,
		source: input.source,
		domainTags: [...(input.domainTags ?? [])].slice(0, 24),
		artifactPaths: [...(input.artifactPaths ?? [])].slice(0, 80),
		commands: [...(input.commands ?? [])].slice(0, 32),
		title: input.title,
		body: input.body,
		stub: true,
	};
}

function stubCase(event: MemoryEventV1): CaseMemoryV1 {
	return {
		kind: "CaseMemoryV1",
		schemaVersion: 1,
		timestamp: event.timestamp,
		task: event.task,
		route: event.route,
		target: event.target,
		stub: true,
	};
}

/**
 * Product-default memory append: returns a stub transaction without writing ledgers.
 */
export function appendMemoryEventTransaction(input: MemoryEventInput): {
	event: MemoryEventV1;
	caseRow: CaseMemoryV1;
	transaction: MemoryAppendTransactionV1;
} {
	const event = stubEvent(input);
	const caseRow = stubCase(event);
	return {
		event,
		caseRow,
		transaction: {
			kind: "MemoryAppendTransactionV1",
			schemaVersion: 1,
			timestamp: event.timestamp,
			status: "stubbed",
			reason: "memory subsystem removed from product surface; enable only via explicit product decision",
		},
	};
}

export function appendMemoryEvent(input: MemoryEventInput): MemoryEventV1 {
	return appendMemoryEventTransaction(input).event;
}

/** Product-default deposition: no bus write; keeps swarm/runtime call sites green. */

export {
	appendMemoryDepositionRuntimeEvent,
	appendSwarmWorkerMemoryEvents,
} from "./memory-transaction-deposition.ts";
