/** Harness /plan and /permission command registration. */
import type { ExtensionAPI, ExtensionContext } from "../../../extensions/types.ts";
import type { RepiHarnessModeState, RepiPermissionMode } from "./types.ts";

export function registerHarnessPlanPermissionCommands(
	pi: ExtensionAPI,
	state: RepiHarnessModeState,
	setPermissionMode: (
		mode: RepiPermissionMode,
		ctx?: ExtensionContext,
		options?: { preservePlanTodos?: boolean },
	) => void,
): void {
	pi.registerFlag("plan", {
		description: "Start REPI in plan mode (read-only exploration)",
		type: "boolean",
		default: false,
	});

	pi.registerCommand("plan", {
		description: "Toggle plan mode or manage plan todos: /plan [on|off|show|execute]",
		handler: async (args, ctx) => {
			const action = (args?.trim().split(/\s+/)[0] || "toggle").toLowerCase();
			if (action === "show") {
				if (state.planTodos.length === 0) {
					ctx.ui.notify("No plan todos yet. Enter plan mode and write a numbered Plan: section.", "info");
					return;
				}
				ctx.ui.notify(
					state.planTodos
						.map((item: any, index: any) => `${index + 1}. ${item.completed ? "done" : "todo"} ${item.text}`)
						.join("\n"),
					"info",
				);
				return;
			}
			if (action === "execute" || action === "run") {
				if (state.planTodos.length === 0) {
					ctx.ui.notify("No plan to execute. Create a numbered Plan: first.", "warning");
					return;
				}
				const incomplete = state.planTodos.findIndex((item: any) => !item.completed);
				setPermissionMode("default", ctx, { preservePlanTodos: true });
				state.executionArmed = true;
				const nextStep =
					incomplete >= 0
						? `Next: ${incomplete + 1}. ${state.planTodos[incomplete].text}`
						: "All plan steps already marked done.";
				ctx.ui.notify(
					`Plan armed for execution (${state.planTodos.filter((t: any) => t.completed).length}/${state.planTodos.length} done). ${nextStep}`,
					"info",
				);
				return;
			}
			if (action === "on" || action === "enable") {
				setPermissionMode("plan", ctx);
				return;
			}
			if (action === "off" || action === "disable") {
				setPermissionMode("default", ctx);
				return;
			}
			setPermissionMode(state.permissionMode === "plan" ? "default" : "plan", ctx);
		},
	});

	pi.registerCommand("permission", {
		description: "Set harness permission mode: /permission [default|plan|acceptEdits|bypass]",
		handler: async (args, ctx) => {
			const mode = (args?.trim().split(/\s+/)[0] || "").trim() as RepiPermissionMode;
			if (!mode) {
				ctx.ui.notify(`permission_mode: ${state.permissionMode}`, "info");
				return;
			}
			if (!["default", "plan", "acceptEdits", "bypass"].includes(mode)) {
				ctx.ui.notify("Usage: /permission default|plan|acceptEdits|bypass", "warning");
				return;
			}
			setPermissionMode(mode, ctx);
		},
	});
}
