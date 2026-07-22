/** Worker child-session bridge evidence contract. */

export function workerChildSessionRuntimeBridgeEvidenceContract(): string[] {
	return [
		"runtime:child-session-pool-bridge-validation",
		"WorkerChildSessionRuntimeBatchV1 must capture childSessionRuntimeCaptured=true before supervisor promotion",
		"poolBridge.workerIds must exactly match child session worker ids",
		"child-session runtime status must be compatible with WorkerRuntimePoolV1 status",
		"child-session claim ledger must bridge into WorkerRuntimePoolV1 claim-aware merge validation",
		"child-session launch policy must keep REPI isolated, update checks disabled, telemetry disabled, and secrets denied",
	];
}
