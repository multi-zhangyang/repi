/** Proof-loop markdown body formatter with reverse proof gates. */
// Landmark: reverse_runtime_capture_gate proof.exit bind_ready=true re_domain_proof_exit formatProofLoop

import { proofLoopNextActionsLines, proofLoopReverseGateLines } from "./format-body-reverse.ts";
import { proofLoopBodySections } from "./format-body-sections.ts";
import type { ProofLoopArtifact } from "./types.ts";

export function formatProofLoop(proof: ProofLoopArtifact, path?: string): string {
	// keep source_artifacts after reverse gates for readability: rebuild order
	const sections = proofLoopBodySections(proof, path);
	const sourceIdx = sections.indexOf("source_artifacts:");
	const head = sourceIdx >= 0 ? sections.slice(0, sourceIdx) : sections;
	const tail = sourceIdx >= 0 ? sections.slice(sourceIdx) : [];
	return [...head, ...proofLoopReverseGateLines(proof), ...proofLoopNextActionsLines(proof), ...tail]
		.filter(Boolean)
		.join("\n");
}
