/** Worker child session status/provider types. */
/** Runtime types: worker child session + process probes. */

export type WorkerChildSessionRuntimeStatus =
	| "starting"
	| "running"
	| "ready"
	| "done"
	| "blocked"
	| "cancelled"
	| "failed"
	| "passed"
	| "timeout"
	| "queued"
	| "exhausted";

export type WorkerChildSessionProviderFormat = "openai-compatible" | "anthropic-compatible" | "local-openai";
