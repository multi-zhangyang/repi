/** Per-execution operator feedback classification. */
import { operatorFeedbackRow, operatorFeedbackToolHint } from "./core-helpers.ts";

export function classifyOperatorExecutionFeedback(
	execution: any,
	targetRef: string,
	operatorArtifact?: string,
): string | undefined {
	const text = `${execution.command}\n${execution.output}`;
	const evidence = execution.output.replace(/\s+/g, " ");
	if (/target placeholder|unresolved target|<target>|<TARGET>|<URL>/i.test(text)) {
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
		/command not found|No such file|cannot stat|ModuleNotFoundError|ImportError|not found|cannot access/i.test(text)
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
	if (/exit=\s*(?:[1-9]|\d{2,})|failed|error|killed=true|blocked/i.test(text) || execution.status === "blocked") {
		return operatorFeedbackRow({
			category: "runtime_failure",
			execution,
			next: `re_autofix plan ${targetRef}`,
			evidence,
			operatorArtifact,
		});
	}
	if (/stdout_sha256|stderr_sha256|replay_matrix|exploit_lab|PoC|poc|payload|crash|offset|RIP|EIP/i.test(text)) {
		return operatorFeedbackRow({
			category: "replay_or_exploit_candidate",
			execution,
			next: /exploit|poc|payload|crash|offset|RIP|EIP/i.test(text)
				? `re_exploit_lab run ${targetRef} 3 60000`
				: `re_replayer run ${targetRef} 1`,
			evidence,
			operatorArtifact,
		});
	}
	if (/artifact|path:|verify:|hash|anchor|checkpoint|proof|verifier_matrix|compiler_report/i.test(text)) {
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
