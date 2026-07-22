/** Per-execution operator feedback classification. */
import { operatorFeedbackRow, operatorFeedbackToolHint } from "./core-helpers.ts";

export function classifyOperatorExecutionFeedback(
	execution: any,
	targetRef: string,
	operatorArtifact?: string,
): string | undefined {
	const text = `${execution.command}\n${execution.output}`;
	const evidence = execution.output.replace(/\s+/g, " ");
	const cmd = String(execution.command ?? "");
	// Only treat as unresolved when the *executed command* or explicit failure text lacks a concrete target.
	const unresolvedCmd =
		/(?:^|\s)(?:re_[a-z0-9_-]+)\s+(?:plan|run|show|dispatch|matrix|check)?\s*(?:<target>|<TARGET>|<URL>|\{target\})(?:\s|$)/i.test(
			cmd,
		) || /unresolved target|target placeholder|missing target/i.test(text);
	if (unresolvedCmd) {
		return operatorFeedbackRow({
			category: "unresolved_target",
			execution,
			next: `re_context pack ${targetRef}`,
			evidence,
			operatorArtifact,
		});
	}
	if (/unsupported operation command|internal REPI command/i.test(text)) {
		return operatorFeedbackRow({
			category: "dispatcher_gap",
			execution,
			next: `re_operator escalate ${targetRef}`,
			evidence,
			operatorArtifact,
		});
	}
	if (
		/command not found|No such file|cannot stat|ModuleNotFoundError|ImportError|cannot access/i.test(text) &&
		!/status=done|proof_loop:|operator_queue:|lane plan/i.test(text)
	) {
		const tool = operatorFeedbackToolHint(text, execution.command) ?? "tool";
		return operatorFeedbackRow({
			category: "missing_tool_or_dependency",
			execution,
			next: `re_bootstrap plan ${tool}`,
			evidence,
			operatorArtifact,
		});
	}
	if (/retry_queue|swarm_retry_queue|execution_audit|coverage_matrix|re_swarm run|worker=/i.test(text)) {
		return operatorFeedbackRow({
			category: execution.status === "blocked" ? "worker_retry_blocked" : "worker_retry_progress",
			execution,
			next: `re_swarm run ${targetRef} 1 1`,
			evidence,
			operatorArtifact,
		});
	}
	// Done steps are not runtime_failure just because output mentions "error=false" / HTML "failed".
	const failedExit = /\bexit\s*=\s*(?:[1-9]\d*)\b/i.test(text) && !/\bexit\s*=\s*0\b/i.test(text);
	const hardFail =
		execution.status === "blocked" ||
		/\bkilled\s*=\s*true\b/i.test(text) ||
		/\berror\s*=\s*true\b/i.test(text) ||
		/\bstatus\s*=\s*(?:failed|blocked)\b/i.test(text) ||
		failedExit ||
		(/\b(?:command not found|traceback \(most recent call last\)|ENOENT|EACCES)\b/i.test(text) &&
			execution.status !== "done");
	if (hardFail) {
		return operatorFeedbackRow({
			category: "runtime_failure",
			execution,
			next: `re_autofix plan ${targetRef}`,
			evidence,
			operatorArtifact,
		});
	}
	// Replay/exploit only when actual exploit/replay surfaces — not bare "offset" in lane notes.
	if (
		/stdout_sha256|stderr_sha256|replay_matrix|\[exploit-lab|re_exploit_lab|crash dump|segfault|instruction pointer|\bRIP=|\bEIP=/i.test(
			text,
		) ||
		(/\b(?:PoC|payload)\b/i.test(text) && /exploit|crash|offset\s*0x/i.test(text))
	) {
		return operatorFeedbackRow({
			category: "replay_or_exploit_candidate",
			execution,
			next: /exploit|poc|payload|crash|RIP|EIP/i.test(text)
				? `re_exploit_lab run ${targetRef} 3 60000`
				: `re_replayer run ${targetRef} 1`,
			evidence,
			operatorArtifact,
		});
	}
	if (
		execution.status === "done" &&
		/artifact|path:|verify:|hash|anchor|checkpoint|proof\.exit|proof_loop|verifier_matrix|compiler_report|bind_ready/i.test(
			text,
		)
	) {
		return operatorFeedbackRow({
			category: "strong_evidence",
			execution,
			next: "re_verifier matrix",
			evidence,
			operatorArtifact,
		});
	}
	return undefined;
}
