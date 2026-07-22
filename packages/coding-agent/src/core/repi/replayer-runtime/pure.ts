/** Replayer pure helpers (hash/matrix/next-command parse). */
import { createHash } from "node:crypto";
import type { ReplayArtifact, ReplayStatus } from "../runtime-types.ts";
import { commandContainsPoison } from "../target.ts";

export function splitRetryNextCommands(next: string): string[] {
	return next
		.split(/\s*(?:&&|;)\s*/g)
		.map((item: any) => item.trim().replace(/^\//, ""))
		.filter((item: any) => /^re[-_]/i.test(item));
}

export function operatorFeedbackNextCommands(feedback: string[]): string[] {
	return Array.from(
		new Set(
			feedback
				.flatMap((row: any) => /\bnext=(.+?)(?:\s+evidence=|\s+source=|$)/i.exec(row)?.[1]?.trim() ?? "")
				.flatMap(splitRetryNextCommands)
				.filter((command: any) => /^re[-_]/i.test(command)),
		),
	).slice(0, 16);
}

export function replayHash(text: string): string {
	return createHash("sha256").update(text).digest("hex");
}

export function replayCommandConcrete(
	command: string,
	target?: string,
): { command: string; blocked?: string; status?: ReplayStatus } {
	let normalized = command.trim().replace(/^\//, "");
	if (!normalized) return { command: normalized, blocked: "empty replay command" };
	if (commandContainsPoison(normalized))
		return { command: normalized, blocked: "natural-language/poison target rejected" };
	if (/<target>|<TARGET>|<URL>|<none>/i.test(normalized)) {
		if (!target) return { command: normalized, blocked: "target placeholder is unresolved" };
		normalized = normalized.replace(/<target>|<TARGET>|<URL>|<none>/gi, target);
	}
	if (/^re[-_]/i.test(normalized))
		return {
			command: normalized,
			status: "skipped",
			blocked:
				"delegated_internal_repi_command; replay matrix records the orchestration step without shell-sandbox execution",
		};
	return { command: normalized };
}

export function buildReplayMatrix(replay: ReplayArtifact): string[] {
	const executionByStep = new Map(replay.executions.map((execution: any) => [execution.stepId, execution]));
	return replay.steps.map((step: any) => {
		const execution = executionByStep.get(step.id);
		if (!execution) {
			return `${step.id} [${step.status}] exit=NA stdout_sha256=NA stderr_sha256=NA command=${step.command}${step.reason ? ` reason=${step.reason}` : ""}`;
		}
		return `${step.id} [${execution.status}] exit=${execution.exit} stdout_sha256=${execution.stdoutHash} stderr_sha256=${execution.stderrHash} command=${execution.command}`;
	});
}
