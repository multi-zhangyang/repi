/** Worker child-session status mapping. */
import type { RepiWorkerChildSessionRuntimeStatus, RepiWorkerRuntimePoolWorkerV1 } from "./types.ts";

export function workerChildRuntimeStatusMatchesPoolStatus(
	runtimeStatus: RepiWorkerChildSessionRuntimeStatus,
	poolStatus: RepiWorkerRuntimePoolWorkerV1["status"],
): boolean {
	switch (runtimeStatus) {
		case "queued":
			return poolStatus === "queued" || poolStatus === "retry_queued";
		case "running":
			return poolStatus === "queued" || poolStatus === "retry_queued";
		case "passed":
			return poolStatus === "done" || poolStatus === "passed";
		case "failed":
			return ["failed", "retry_queued", "exhausted", "blocked"].includes(poolStatus);
		case "timeout":
			return ["timeout", "cancelled", "retry_queued", "exhausted", "blocked"].includes(poolStatus);
		case "cancelled":
			return ["cancelled", "retry_queued", "exhausted", "blocked"].includes(poolStatus);
		case "exhausted":
			return poolStatus === "exhausted" || poolStatus === "blocked";
		default:
			return false;
	}
}
