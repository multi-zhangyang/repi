/** Proof-loop formatting helpers. */
import type { ProofLoopRuntimeAdapterClosureRow } from "./types.ts";

export { formatProofLoop } from "./format-body.ts";
export { caseMemoryLanePlanLines } from "./format-case.ts";

export function formatProofLoopRuntimeAdapterClosureRow(row: ProofLoopRuntimeAdapterClosureRow): string {
	return [
		`adapter=${row.adapterId}`,
		`status=${row.status}`,
		`missing=${row.missingProofSignals.join(" | ") || "<none>"}`,
		`matched=${row.matchedProofSignals.join(" | ") || "<none>"}`,
		`commands=${row.commands.join(" && ") || "<none>"}`,
		`evidence=${row.sourceArtifacts.slice(0, 4).join(" | ") || "none"}`,
	].join(" ");
}
