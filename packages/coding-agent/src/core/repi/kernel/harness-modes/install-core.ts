/** Install REPI harness /plan and /permission modes. */
import process from "node:process";
import type { ExtensionAPI, ExtensionContext } from "../../../extensions/types.ts";
import { activateToolsForRoute, startupHarnessPacketLines } from "./install-activate.ts";
import { createHarnessApplyTools } from "./install-apply-tools.ts";
import { registerHarnessPlanPermissionCommands } from "./install-core-commands.ts";
import { registerHarnessModeHooks } from "./install-core-hooks.ts";
import type { RepiHarnessModesHandle } from "./install-types.ts";
import { setRepiHarnessModesHandle } from "./install-types.ts";
import {
	createHarnessModeState,
	parsePermissionMode,
	type RepiHarnessModeState,
	type RepiPermissionMode,
} from "./types.ts";

export function installRepiHarnessModes(
	pi: ExtensionAPI,
	options: { initialMode?: RepiPermissionMode } = {},
): {
	getState: () => RepiHarnessModeState;
	setPermissionMode: (mode: RepiPermissionMode, ctx?: ExtensionContext) => void;
	activateForRoute: (domain: string, ctx?: ExtensionContext) => string[];
	startupPacketLines: () => string[];
} {
	const envMode = parsePermissionMode(process.env.REPI_PERMISSION_MODE);
	const state = createHarnessModeState(options.initialMode ?? envMode ?? "default");
	const { applyTools } = createHarnessApplyTools(pi, state);

	const setPermissionMode = (
		mode: RepiPermissionMode,
		ctx?: ExtensionContext,
		options?: { preservePlanTodos?: boolean },
	) => {
		state.permissionMode = mode;
		state.executionArmed = mode !== "plan";
		// /plan execute arms default mode but must keep the task tree for [DONE:n] tracking.
		if (mode !== "plan" && !options?.preservePlanTodos) state.planTodos = [];
		pi.appendEntry("repi-permission-mode", {
			timestamp: Date.now(),
			mode,
			preservePlanTodos: Boolean(options?.preservePlanTodos),
			planTodos: state.planTodos.length,
		});
		applyTools(ctx);
		if (ctx?.hasUI) {
			ctx.ui.notify(
				mode === "plan"
					? "Plan mode: read-only tools + safe bash. Write a numbered Plan:, then /plan execute."
					: options?.preservePlanTodos
						? `Plan armed (${state.planTodos.length} steps). Mark progress with [DONE:n].`
						: `Permission mode: ${mode}`,
				"info",
			);
		}
	};

	registerHarnessPlanPermissionCommands(pi, state, setPermissionMode);
	registerHarnessModeHooks(pi, state, setPermissionMode, applyTools);

	const activateForRoute = (domain: string, ctx?: ExtensionContext): string[] =>
		activateToolsForRoute(pi, state, domain, ctx, applyTools);

	const handle: RepiHarnessModesHandle = {
		getState: () => state,
		setPermissionMode,
		activateForRoute,
		startupPacketLines: () => startupHarnessPacketLines(state),
	};
	setRepiHarnessModesHandle(handle);
	return handle;
}
