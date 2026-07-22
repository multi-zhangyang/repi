/** Proof-loop memory outcome classifier. */

import type { MemoryOutcome } from "../lane-memory-types.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";

export function proofLoopMemoryOutcome(proof: ProofLoopArtifact): MemoryOutcome {
	if (proof.verdict === "ready") return "success";
	if (proof.verdict === "needs_repair") return "repair";
	if (proof.verdict === "blocked") return "blocked";
	return "partial";
}
