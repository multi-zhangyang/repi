/** Context-pack compact-resume transition recording. */
export function recordContextPackCompactResumeTransitions(params: {
	mode: string;
	options: any;
	appendCompactResumeTransition: (...args: any[]) => any;
	idempotencyKey: string;
	contextPath: string;
	autonomousBudget: any;
}): void {
	const { mode, options, appendCompactResumeTransition, idempotencyKey, contextPath, autonomousBudget } = params;
	if (options.recordCompactResume === false) return;
	const maxAttempts = Math.max(1, autonomousBudget.maxTurns);
	if (mode === "resume") {
		appendCompactResumeTransition({
			from: "queued",
			to: "running",
			command: "re_context resume",
			reason: "context resume started from rebuilt current state",
			idempotencyKey,
			contextPath,
			maxAttempts,
		});
		appendCompactResumeTransition({
			to: "done",
			command: "re_context resume",
			reason: "context resume rebuilt and closed",
			idempotencyKey,
			contextPath,
			maxAttempts,
		});
		return;
	}
	appendCompactResumeTransition({
		from: "queued",
		to: "queued",
		command: "re_context pack",
		reason: "context pack queued for exact compact resume",
		idempotencyKey,
		contextPath,
		maxAttempts,
	});
}
