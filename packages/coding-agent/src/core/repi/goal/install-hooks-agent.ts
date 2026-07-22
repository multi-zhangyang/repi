/** Session/agent hooks for REPI goal mode. */
import { agentSettledTargetFromContext, waitForAgentSettled } from "../../agent-settled.ts";
import type { ExtensionAPI } from "../../extensions/types.ts";
import { pauseGoalAfterAgentEnd } from "./commands.ts";
import { formatBudget, formatError } from "./format.ts";
import { buildGoalSystemPrompt, findFinalAssistantMessage } from "./prompt.ts";
import {
	cancelContinuationPending,
	clearGoalRecoveryForGoal,
	incrementGoal,
	isGoalContextOverflow,
	isRetryableGoalInterruption,
	markContinuationDelivered,
	persistGoal,
	sendContinuationPrompt,
	transitionGoal,
	updateGoalUsage,
	updateStatus,
} from "./state.ts";
import type { GoalRecoveryKind, RepiGoalRuntime } from "./types.ts";
import { PROVIDER_RETRY_BUDGET } from "./types.ts";
export function installRepiGoalAgentHooks(pi: ExtensionAPI, runtime: RepiGoalRuntime): void {
	pi.on("before_agent_start", (event: any, ctx: any) => {
		markContinuationDelivered(runtime, event.prompt);
		if (!runtime.activeGoal || runtime.activeGoal.status !== "active") return undefined;
		updateGoalUsage(runtime.activeGoal, ctx);
		updateStatus(runtime, ctx, runtime.activeGoal);
		return {
			systemPrompt: `${event.systemPrompt}\n\n${buildGoalSystemPrompt(runtime.activeGoal)}`,
		};
	});
	pi.on("agent_end", async (event: any, ctx: any) => {
		if (!runtime.activeGoal || runtime.activeGoal.status !== "active") return;
		// Pi-aligned: let agent_end listeners / streaming settle before goal continue/pause.
		await waitForAgentSettled(agentSettledTargetFromContext(ctx), { timeoutMs: 5000 });
		const goalId = runtime.activeGoal.id;
		const finalAssistant = findFinalAssistantMessage(event.messages);
		runtime.activeGoal = incrementGoal(runtime.activeGoal);
		updateGoalUsage(runtime.activeGoal, ctx);
		if (finalAssistant?.stopReason === "aborted" || finalAssistant?.stopReason === "error") {
			if (isRetryableGoalInterruption(finalAssistant)) {
				const recoveryKind: GoalRecoveryKind = isGoalContextOverflow(finalAssistant)
					? "compaction_retry"
					: "provider_retry";
				runtime.goalRecovery = { goalId, kind: recoveryKind };
				cancelContinuationPending(runtime);
				persistGoal(pi, runtime.activeGoal);
				updateStatus(runtime, ctx, runtime.activeGoal);
				if (recoveryKind === "compaction_retry") {
					ctx.ui.notify("Goal hit context overflow; compacting then continuing.", "warning");
					ctx.compact({
						customInstructions:
							"Preserve the active REPI /goal objective, completed evidence, unresolved checks, current commands, changed files, and exact next action. Resume goal mode after compaction. For reverse/pentest goals, preserve proof.exit/bind_ready capture status.",
						onError: (error: any) => {
							ctx.ui.notify(
								`Goal compaction failed: ${formatError(error)}. Run /goal resume after fixing it.`,
								"error",
							);
						},
					});
					return;
				}
				const attempts = (runtime.recoveryAttempts.get(goalId) ?? 0) + 1;
				runtime.recoveryAttempts.set(goalId, attempts);
				if (attempts <= PROVIDER_RETRY_BUDGET && !ctx.hasPendingMessages()) {
					ctx.ui.notify(`Goal provider interruption; retrying (${attempts}/${PROVIDER_RETRY_BUDGET}).`, "warning");
					await sendContinuationPrompt(pi, runtime, ctx, runtime.activeGoal);
					return;
				}
			}
			clearGoalRecoveryForGoal(runtime, goalId);
			pauseGoalAfterAgentEnd(pi, runtime, ctx, runtime.activeGoal, finalAssistant);
			return;
		}
		clearGoalRecoveryForGoal(runtime, goalId);
		runtime.recoveryAttempts.delete(goalId);
		if (
			runtime.activeGoal.tokenBudget !== undefined &&
			runtime.activeGoal.tokensUsed >= runtime.activeGoal.tokenBudget
		) {
			cancelContinuationPending(runtime);
			runtime.activeGoal = transitionGoal(runtime.activeGoal, "budget_limited");
			persistGoal(pi, runtime.activeGoal);
			updateStatus(runtime, ctx, runtime.activeGoal);
			ctx.ui.notify(`Goal token budget reached: ${formatBudget(runtime.activeGoal)}`, "warning");
			return;
		}
		persistGoal(pi, runtime.activeGoal);
		updateStatus(runtime, ctx, runtime.activeGoal);
		const currentGoal = runtime.activeGoal;
		if (!currentGoal || currentGoal.id !== goalId || currentGoal.status !== "active") return;
		if (ctx.hasPendingMessages()) return;
		await sendContinuationPrompt(pi, runtime, ctx, currentGoal);
	});
}
