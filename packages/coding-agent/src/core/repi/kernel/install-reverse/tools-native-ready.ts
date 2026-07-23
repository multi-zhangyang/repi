/** Native reverse-ready thrash helpers. */
import { updateMissionCheckpoint } from "../../mission.ts";
import { isMissionReverseBound, markMissionReverseBound } from "./tools-capture-inflight.ts";

export function reverseProofBound(): boolean {
	// Process-local only. Shared disk missions from prior print runs keep done checkpoints
	// that would otherwise false-stop first capture on a fresh process.
	try {
		return isMissionReverseBound();
	} catch {
		return false;
	}
}

export function softMarkReverseFromNative(path: string): void {
	try {
		markMissionReverseBound();
		updateMissionCheckpoint("reverse_proof_exit_ready", "pending", `runtime_adapter native ${path}`);
		updateMissionCheckpoint("minimal_path_proven", "pending", `runtime_adapter native ${path}`);
	} catch {
		/* optional */
	}
}

export function buildNativeReverseReadyStopText(domain: string): string {
	const nl = "\n";
	return [
		"native_runtime:",
		"status: reverse_ready_stop",
		`route_domain: ${domain || "unknown"}`,
		"note: reverse capture already bound; do not thrash re_native_runtime",
		"next: re_domain_proof_exit show → re_operator plan/dispatch → re_complete → HARNESS_BUGS/PROOF only",
	].join(nl);
}
