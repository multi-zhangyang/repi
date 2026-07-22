/** Child-session status/provider format types. */
/** Worker-runtime types: child-session. */

export type RepiWorkerChildSessionRuntimeStatus =
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

export type RepiWorkerChildSessionProviderFormat = "openai-compatible" | "anthropic-compatible" | "local-openai";
