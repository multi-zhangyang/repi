/** Goal prompt send helpers */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { formatError } from "./format.ts";
import { buildContinuePrompt, buildGoalPrompt, buildObjectiveUpdatedPrompt, buildResumePrompt } from "./prompt.ts";
import { continuationMarker } from "./state-continuation.ts";
import type { RepiGoalContext, RepiGoalRuntime, RepiGoalState } from "./types.ts";

export async function sendGoalPrompt(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	goal: RepiGoalState,
): Promise<boolean> {
	return sendPrompt(pi, runtime, ctx, buildGoalPrompt(goal));
}

export async function sendObjectiveUpdatedPrompt(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	goal: RepiGoalState,
): Promise<boolean> {
	return sendPrompt(pi, runtime, ctx, buildObjectiveUpdatedPrompt(goal));
}

export async function sendResumePrompt(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	goal: RepiGoalState,
): Promise<boolean> {
	return sendPrompt(pi, runtime, ctx, buildResumePrompt(goal));
}

export async function sendContinuationPrompt(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	goal: RepiGoalState,
): Promise<boolean> {
	if (runtime.continuationPending?.goalId === goal.id) return false;
	if (ctx.hasPendingMessages()) return false;

	const marker = continuationMarker(goal);
	const prompt = buildContinuePrompt(goal, marker);
	runtime.continuationPending = { goalId: goal.id, iteration: goal.iteration, marker, prompt };
	const sent = await sendPrompt(pi, runtime, ctx, prompt);
	if (!sent && runtime.continuationPending?.marker === marker) runtime.continuationPending = undefined;
	return sent;
}

async function sendPrompt(
	pi: ExtensionAPI,
	_runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	prompt: string,
): Promise<boolean> {
	try {
		const sent = ctx.isIdle()
			? (pi.sendUserMessage(prompt) as void | Promise<void>)
			: (pi.sendUserMessage(prompt, { deliverAs: "followUp" }) as void | Promise<void>);
		await sent;
		return true;
	} catch (error) {
		ctx.ui.notify(`Goal prompt failed: ${formatError(error)}`, "error");
		return false;
	}
}
