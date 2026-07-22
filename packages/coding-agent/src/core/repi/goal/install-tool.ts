/** goal_complete tool registration for REPI goal mode. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../extensions/types.ts";
import {
	clearActiveGoal,
	isContradictoryCompletionSummary,
	persistGoal,
	showCompletionStatus,
	transitionGoal,
	updateGoalUsage,
	updateStatus,
} from "./state.ts";
import type { GoalCompleteDetails, RepiGoalRuntime } from "./types.ts";

export function registerRepiGoalCompleteTool(pi: ExtensionAPI, runtime: RepiGoalRuntime): void {
	pi.registerTool({
		name: "goal_complete",
		label: "Goal Complete",
		description:
			"Mark the active REPI /goal as complete after all required work is finished and verified. Do not use for partial progress, blockers, failing checks, or unverified claims.",
		promptSnippet: "Mark the active REPI /goal as complete after fully finishing and verifying it",
		promptGuidelines: [
			"When a REPI /goal is active, keep working until the goal is complete; do not stop with only a plan, TODO list, partial progress, or suggested next steps.",
			"Before calling goal_complete, audit the active goal requirement by requirement against current files, command output, tests, runtime behavior, or external state.",
			"Call goal_complete only after the requested goal is fully implemented, verified, and no known required work remains; otherwise continue working.",
			"For reverse/pentest goals, do not complete while reverse proof.exit is pending_runtime_capture or bind_ready=false; require partial_runtime_capture|runtime_capture_strong evidence first.",
		],
		parameters: Type.Object({
			summary: Type.String({
				description:
					"What was completed and which evidence verified it. Do not report partial progress, blockers, failures, or remaining work here.",
			}),
		}),
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const completedGoal = runtime.activeGoal;
			const goal = completedGoal?.text ?? "unknown goal";
			const summary = String(params.summary ?? "").trim();

			if (!completedGoal) {
				const rejection = "Goal completion rejected: no active /goal.";
				ctx.ui.notify(rejection, "warning");
				return {
					content: [{ type: "text" as const, text: rejection }],
					details: { goal, summary, status: "rejected", reason: "no active goal" } satisfies GoalCompleteDetails,
				};
			}

			const rejectionReason = !summary
				? "summary is empty"
				: isContradictoryCompletionSummary(summary)
					? "summary says the goal is not complete"
					: undefined;
			if (rejectionReason) {
				updateGoalUsage(completedGoal, ctx);
				persistGoal(pi, completedGoal);
				updateStatus(runtime, ctx, completedGoal);
				const rejection = `Goal completion rejected: ${rejectionReason}.`;
				ctx.ui.notify(rejection, "warning");
				return {
					content: [{ type: "text" as const, text: rejection }],
					details: { goal, summary, status: "rejected", reason: rejectionReason } satisfies GoalCompleteDetails,
				};
			}

			runtime.activeGoal = transitionGoal(completedGoal, "complete");
			updateGoalUsage(runtime.activeGoal, ctx);
			persistGoal(pi, runtime.activeGoal);
			clearActiveGoal(pi, runtime, ctx, { showStatus: false });
			showCompletionStatus(runtime, ctx);
			ctx.ui.notify(`Goal complete: ${goal}`, "info");

			return {
				content: [{ type: "text" as const, text: `Goal complete: ${summary}` }],
				details: { goal, summary, status: "accepted" } satisfies GoalCompleteDetails,
				terminate: true,
			};
		},
	});
}
