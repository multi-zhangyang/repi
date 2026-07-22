/** Memory deposition + swarm stubs (product-lean). */
// Landmark: appendMemoryDepositionRuntimeEvent appendSwarmWorkerMemoryEvents
import type { MemoryDepositionRuntimeEventV7, MemoryDepositionRuntimeInputV7 } from "./memory-transaction-types.ts";

export function appendMemoryDepositionRuntimeEvent(
	input: MemoryDepositionRuntimeInputV7,
	_options: { writeback?: boolean } = {},
): MemoryDepositionRuntimeEventV7 {
	// Product surface: memory deposition bus is disabled; return explicit stub.
	return {
		kind: "MemoryDepositionRuntimeEventV7",
		schemaVersion: 1,
		timestamp: new Date().toISOString(),
		task: input.task ?? "",
		route: input.route ?? "",
		target: input.target ?? "",
		status: "stubbed",
		reason: "memory deposition bus disabled on product surface",
		stub: true,
	};
}

/** Swarm worker memory fan-out stays stubbed with the memory product surface. */
export function appendSwarmWorkerMemoryEvents(..._args: any[]): void {
	// no-op on product surface
}
