/** Operator feedback next/fallback command assembly. */

import { splitRetryNextCommands } from "../replayer-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { commandContainsPoison, sanitizeTargetForCommand } from "../target.ts";
import { operatorFeedbackCategory } from "./feedback-category.ts";

export function operatorFeedbackFallbackCommands(row: string, target?: string): string[] {
	const category = operatorFeedbackCategory(row);
	const targetRef = target ?? "<target>";
	const primary = operatorFeedbackNextCommands([row]);
	const fallback = /missing_tool_or_dependency/i.test(category)
		? ["re_tool_index refresh", ...primary]
		: /unresolved_target/i.test(category)
			? [`re_context pack ${targetRef}`, `re_map ${targetRef} 2`]
			: /dispatcher_gap/i.test(category)
				? [...primary, `re_operator escalate ${targetRef}`, `re_context pack ${targetRef}`]
				: /runtime_failure/i.test(category)
					? [...primary, `re_replayer run ${targetRef} 1`, `re_proof_loop run ${targetRef} 4 2`]
					: /failure_budget_exhausted/i.test(category)
						? [
								`re_proof_loop run ${targetRef} 4 2`,
								`re_context pack ${targetRef}`,
								`re_operator dispatch ${targetRef} 1`,
							]
						: /swarm_retry_queue|worker_retry_blocked|worker_retry_progress/i.test(category)
							? [
									...primary,
									`re_swarm merge`,
									`re_supervisor repair ${targetRef}`,
									`re_context pack ${targetRef}`,
								]
							: /replay_or_exploit_candidate/i.test(category)
								? [...primary, `re_replayer run ${targetRef} 1`, `re_exploit_lab run ${targetRef} 3 60000`]
								: /strong_evidence/i.test(category)
									? ["re_verifier matrix", "re_compiler draft"]
									: primary;
	return Array.from(
		new Set(
			fallback
				.flatMap(splitRetryNextCommands)
				.map((command: any) => operatorCommandConcrete(command, target).command)
				.filter((command: any) => /^re[-_]/i.test(command)),
		),
	).slice(0, 8);
}

export function operatorCommandConcrete(command: string, target?: string): { command: string; blocked?: string } {
	const normalized = command.trim().replace(/^\//, "");
	if (commandContainsPoison(normalized))
		return { command: normalized, blocked: "natural-language/poison target rejected" };
	if (/<target>|<TARGET>|<URL>|<none>/i.test(normalized)) {
		const safeTarget = sanitizeTargetForCommand(target);
		if (!safeTarget) return { command: normalized, blocked: "target placeholder is unresolved" };
		return { command: normalized.replace(/<target>|<TARGET>|<URL>|<none>/gi, safeTarget) };
	}
	return { command: normalized };
}

export function bootstrapToolFromCommand(command: string): string | undefined {
	const token = command
		.trim()
		.split(/\s+/)[0]
		?.replace(/^['"]|['"]$/g, "");
	if (!token || /^(set|test|cat|printf|sed|grep|rg|awk|bash|sh|python|node)$/i.test(token)) return undefined;
	return token;
}

export function operatorFeedbackNextCommands(feedback: string[]): string[] {
	const reverseBlob = feedback.join("\n");
	const reverseOpen =
		/technique|proof_exit|mitre|cwe|native-runtime|pwn|bind_ready|pending_runtime_capture|reverse_kind|malware|firmware|frontend|js|browser|authz|mobile|web/i.test(
			reverseBlob,
		);
	const reverseCommands = reverseOpen ? reverseDomainCaptureNextCommands({ routeOrBlob: reverseBlob }) : [];
	return Array.from(
		new Set([
			...reverseCommands,
			...feedback
				.flatMap((row: any) => /\bnext=(.+?)(?:\s+evidence=|\s+source=|$)/i.exec(row)?.[1]?.trim() ?? "")
				.flatMap(splitRetryNextCommands)
				.filter((command: any) => /^re[-_]/i.test(command)),
		]),
	).slice(0, 16);
}
