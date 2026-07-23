/** Native reverse-ready thrash helpers. */
import { readCurrentMission, updateMissionCheckpoint } from "../../mission.ts";
import { isMissionReverseBound, markMissionReverseBound } from "./tools-capture-inflight.ts";

export function reverseProofBound(): boolean {
	try {
		if (isMissionReverseBound()) return true;
	} catch {
		/* optional */
	}
	try {
		const mission = readCurrentMission();
		const cps = mission?.checkpoints;
		if (!Array.isArray(cps)) return false;
		// Capture already materialized this mission (stronger thrash signal than default pending).
		if (
			cps.some(
				(c: { name?: string; status?: string }) =>
					(c.name === "native_runtime_ready" ||
						c.name === "mobile_runtime_ready" ||
						c.name === "live_browser_ready") &&
					c.status === "done",
			)
		) {
			return true;
		}
		return cps.some((c: { name?: string; status?: string; note?: string }) => {
			if (!(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven")) return false;
			if (c.status === "done") return true;
			// Soft-mark from successful runtime adapter/native/browser capture only.
			return c.status === "pending" && String(c.note ?? "").includes("runtime_adapter");
		});
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
