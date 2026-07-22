import type { ExtensionAPI } from "../../extensions/types.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { emptyGoalSummary, goalSummary } from "./format.ts";
import { persistGoal, updateGoalUsage, updateStatus } from "./state.ts";
import type { RepiGoalContext, RepiGoalRuntime } from "./types.ts";
import { EDIT_TOKEN_COMPLETION, STATUS_KEY } from "./types.ts";

void EDIT_TOKEN_COMPLETION;
export function showGoal(pi: ExtensionAPI, runtime: RepiGoalRuntime, ctx: RepiGoalContext): void {
	if (!runtime.activeGoal) {
		ctx.ui.notify(emptyGoalSummary(), "info");
		ctx.ui.setStatus(STATUS_KEY, undefined);
		return;
	}
	updateGoalUsage(runtime.activeGoal, ctx);
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);
	ctx.ui.notify(goalSummary(runtime.activeGoal), "info");
}

void EDIT_TOKEN_COMPLETION;
export function showGoalHelp(pi: ExtensionAPI, runtime: RepiGoalRuntime, ctx: RepiGoalContext): void {
	if (runtime.activeGoal) {
		updateGoalUsage(runtime.activeGoal, ctx);
		persistGoal(pi, runtime.activeGoal);
		updateStatus(runtime, ctx, runtime.activeGoal);
	} else {
		ctx.ui.setStatus(STATUS_KEY, undefined);
	}
	const active = runtime.activeGoal ? `\n\nCurrent:\n${goalSummary(runtime.activeGoal)}` : "";
	ctx.ui.notify(
		[
			"REPI /goal runs a task until verified completion.",
			"",
			"Usage:",
			"  /goal [--tokens 100k] <objective>",
			"  /goal status",
			"  /goal pause | resume | clear",
			"  /goal edit [--tokens 100k] <objective>",
			"",
			"Completion:",
			"  The footer shows 🎯 active/paused/budget/complete.",
			"  The agent must call goal_complete only after requirement-by-requirement verification.",
			"",
			"Status panel:",
			"  /goal status shows footer preview, elapsed/token budget, progress bar, and the safest next command.",
			"",
			"Examples:",
			"  /goal --tokens 100k finish the release checklist",
			"  /goal status",
			"  /goal clear",
			"",
			"Non-TUI/RPC:",
			"  print/json/rpc modes emit notifications/status events and queue continuation as follow-up; no blocking confirm.",
			"",
			"Reverse/pentest completion:",
			"  goal_complete only after proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready.",
			...reverseDomainCaptureNextCommands({
				routeOrBlob: runtime.activeGoal?.text ?? "goal reverse capture",
				includeGates: true,
			})
				.slice(0, 3)
				.map((cmd: any) => `  next: ${cmd}`),
		].join("\n") + active,
		"info",
	);
}
