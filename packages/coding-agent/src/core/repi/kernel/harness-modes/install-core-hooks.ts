/** Harness session/tool/message hooks for plan/permission modes. */
import process from "node:process";
import type { ExtensionAPI, ToolCallEvent } from "../../../extensions/types.ts";
import { permissionBashGate, planModeToolGate } from "./install-gates.ts";
import { assistantTextFromMessageEnd } from "./message-helpers.ts";
import { extractPlanTodos, markPlanTodosDone } from "./plan-todos.ts";
import type { RepiHarnessModeState, RepiPermissionMode } from "./types.ts";

export function registerHarnessModeHooks(
	pi: ExtensionAPI,
	state: RepiHarnessModeState,
	setPermissionMode: (mode: RepiPermissionMode, ctx?: any) => void,
	applyTools: (ctx?: any) => void,
): void {
	pi.on("session_start", async (_event: any, ctx: any) => {
		if (process.env.REPI_PLAN === "1" || process.env.REPI_PERMISSION_MODE === "plan") {
			setPermissionMode("plan", ctx);
		} else {
			applyTools(ctx);
		}
	});

	pi.on("tool_call", async (event: ToolCallEvent) => {
		if (state.permissionMode === "plan") {
			return planModeToolGate(event);
		}
		return permissionBashGate(pi, event, state.permissionMode);
	});

	pi.on("message_end", async (event: any) => {
		const assistantText = assistantTextFromMessageEnd(event);
		if (!assistantText) return;
		if (state.permissionMode === "plan") {
			const extracted = extractPlanTodos(assistantText);
			if (extracted.length > 0) state.planTodos = extracted;
		}
		if (state.planTodos.length > 0) markPlanTodosDone(assistantText, state.planTodos);
	});
}
