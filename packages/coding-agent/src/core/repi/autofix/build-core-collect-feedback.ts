/** Autofix collectors: operator feedback. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { AutofixCollectCtx } from "./build-core-collect-types.ts";
import { operatorFeedbackNextCommands } from "./deps.ts";

export function collectAutofixFeedbackQueues(ctx: AutofixCollectCtx): void {
	const {
		options,
		replay,
		operatorFeedback,
		commandSubstitutions,
		bootstrapQueue,
		evidenceRecaptureQueue,
		nextOperatorQueue,
		add,
	} = ctx;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${options.target ?? replay.target ?? ""} autofix feedback`,
		target: options.target ?? replay.target,
		includeGates: true,
	}).slice(0, 2);
	for (const cmd of reverseNext) nextOperatorQueue.push(cmd);
	for (const feedback of operatorFeedback.slice(0, 16)) {
		const next = operatorFeedbackNextCommands([feedback])[0] ?? "re_operator escalate";
		if (/category=missing_tool_or_dependency/i.test(feedback)) {
			add(bootstrapQueue, "bootstrap", feedback, "operator feedback classified missing tool/dependency", next);
			nextOperatorQueue.push(next);
			continue;
		}
		if (/category=unresolved_target/i.test(feedback)) {
			add(
				evidenceRecaptureQueue,
				"evidence_recapture",
				feedback,
				"operator feedback classified unresolved target",
				next,
			);
			nextOperatorQueue.push(next);
			continue;
		}
		if (
			/category=swarm_retry_queue/i.test(feedback) ||
			/category=(worker_retry_blocked|failure_budget_exhausted)/i.test(feedback)
		) {
			add(
				evidenceRecaptureQueue,
				"evidence_recapture",
				feedback,
				"operator feedback requires bounded worker retry",
				next,
			);
			nextOperatorQueue.push(next);
			continue;
		}
		if (/category=(dispatcher_gap|runtime_failure)/i.test(feedback)) {
			add(
				commandSubstitutions,
				"command_substitution",
				feedback,
				"operator feedback requires dispatcher/autofix reroute",
				next,
			);
			nextOperatorQueue.push(next);
			continue;
		}
		if (/category=replay_or_exploit_candidate/i.test(feedback)) {
			nextOperatorQueue.push(next, `re_exploit_lab run ${options.target ?? replay.target ?? "<target>"} 3 60000`);
		}
	}
}
