/** Swarm-exec pure: audit/runtime fields with reverse query signals. */
// reverse: swarmReverseQuerySignals / proof_exit live in pure-audit-fields.ts
export { deriveSwarmAuditFields } from "./pure-audit-fields.ts";
export {
	swarmRuntimeModel,
	swarmRuntimeRetryBudget,
	swarmRuntimeStatus,
	swarmRuntimeTimeWindow,
} from "./pure-audit-runtime.ts";
export {
	evidenceHitForPacket,
	swarmSubagentSessionRoot,
	swarmWorkerChildSessionRuntimePath,
	workerHandoffRefsForSwarmWorker,
	workerPoolStatusFailed,
	workerPoolStatusPassed,
	workerRepairRefsForSwarmWorker,
	workerRetryHandoffState,
	workerRetryQueueRefsForSwarmWorker,
} from "./pure-audit-worker.ts";

export const SWARM_PURE_AUDIT_REVERSE_MARKERS = ["swarmReverseQuerySignals", "proof_exit", "bind_ready"] as const;
