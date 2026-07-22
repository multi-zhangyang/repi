/** /goal command registration and start/replace helpers. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import {
	clearGoal,
	completeGoalArguments,
	createGoal,
	editGoal,
	parseGoalCommand,
	pauseGoal,
	resumeGoal,
	showGoal,
	showGoalHelp,
} from "./commands.ts";
import { currentTokenTotal } from "./format.ts";
import { validateObjective } from "./prompt.ts";
import {
	cancelContinuationPending,
	clearGoalRecovery,
	clearStaleGoalToolCallBlock,
	persistGoal,
	sendGoalPrompt,
	updateStatus,
} from "./state.ts";
import type { RepiGoalContext, RepiGoalRuntime, RepiGoalState } from "./types.ts";

export function registerRepiGoalCommand(pi: ExtensionAPI, runtime: RepiGoalRuntime): void {
	pi.registerCommand("goal", {
		description: "Run a REPI goal to completion: /goal [--tokens 100k] <goal_to_complete>",
		getArgumentCompletions: completeGoalArguments,
		handler: async (args, ctx) => {
			const result = parseGoalCommand(args);
			if (typeof result === "string") {
				ctx.ui.notify(result, "warning");
				return;
			}

			switch (result.kind) {
				case "help":
					showGoalHelp(pi, runtime, ctx);
					return;
				case "show":
					showGoal(pi, runtime, ctx);
					return;
				case "pause":
					pauseGoal(pi, runtime, ctx);
					return;
				case "resume":
					await resumeGoal(pi, runtime, ctx);
					return;
				case "clear":
					clearGoal(pi, runtime, ctx);
					return;
				case "edit":
					await editGoal(pi, runtime, result.objective ?? "", result.tokenBudget, ctx);
					return;
				case "start":
					await startGoal(pi, runtime, result.objective ?? "", result.tokenBudget, ctx);
					return;
			}
		},
	});
}

export async function startGoal(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	objective: string,
	tokenBudget: number | undefined,
	ctx: RepiGoalContext,
): Promise<void> {
	const trimmedObjective = objective.trim();
	const validationError = validateObjective(trimmedObjective);
	if (validationError) {
		ctx.ui.notify(validationError, "warning");
		return;
	}

	const existingGoal = runtime.activeGoal?.status !== "complete" ? runtime.activeGoal : undefined;
	if (existingGoal) {
		const shouldReplace = await shouldReplaceExistingGoal(ctx, existingGoal, trimmedObjective);
		if (!shouldReplace) {
			ctx.ui.notify(`Goal kept: ${existingGoal.text}`, "info");
			return;
		}
	}

	cancelContinuationPending(runtime);
	clearGoalRecovery(runtime);
	clearStaleGoalToolCallBlock(runtime);
	runtime.activeGoal = createGoal(trimmedObjective, tokenBudget, currentTokenTotal(ctx));
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);
	ctx.ui.notify(existingGoal ? `Goal replaced: ${trimmedObjective}` : `Goal started: ${trimmedObjective}`, "info");
	await sendGoalPrompt(pi, runtime, ctx, runtime.activeGoal);
}

async function shouldReplaceExistingGoal(
	ctx: RepiGoalContext,
	existingGoal: RepiGoalState,
	newObjective: string,
): Promise<boolean> {
	if (!ctx.hasUI || ctx.mode !== "tui") return true;
	return ctx.ui.confirm("Replace REPI goal?", `Current goal: ${existingGoal.text}\n\nNew goal: ${newObjective}`, {
		timeout: 30_000,
	});
}
