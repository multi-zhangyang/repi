/** Structured/knowledge memory command candidates — product lean (memory subsystem removed). */

import type { MissionLane, MissionState } from "../mission.ts";
import type { MemoryCommandCandidate } from "../playbooks.ts";
import { envBoolean } from "../text.ts";
import { seedReverseProofCandidates } from "./reverse-seed.ts";

/**
 * Product default: no memory sedimentation fan-out.
 * Reverse-heavy routes still seed domain capture next via seedReverseProofCandidates.
 */
export function structuredMemoryCommandCandidates(
	mission: MissionState,
	lane: MissionLane,
	_target?: string,
): MemoryCommandCandidate[] {
	return seedReverseProofCandidates(mission, lane, []);
}

/**
 * Case-memory fan-out off unless REPI_CONTEXT_MEMORY / REPI_FULL_SURFACE.
 * Even when on, product has no memory store — return reverse seeds only.
 */
export function knowledgeCaseMemoryCandidates(
	mission: MissionState,
	lane: MissionLane,
	_target?: string,
): MemoryCommandCandidate[] {
	if (envBoolean("REPI_CONTEXT_MEMORY") !== true && envBoolean("REPI_FULL_SURFACE") !== true) {
		return [];
	}
	return seedReverseProofCandidates(mission, lane, []);
}
