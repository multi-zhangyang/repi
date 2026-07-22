/**
 * Claude Code-style harness modes for REPI.
 *
 * Plan mode = read-only exploration + bounded task tree.
 * Permission mode = tool surface / bash danger gate.
 *
 * Implementation split under ./harness-modes/*.
 */
import type { ExtensionContext } from "../../extensions/types.ts";
import {
	ACCEPT_EDITS_TOOLS,
	CORE_ACTIVE_TOOLS,
	DOMAIN_ACTIVE_TOOLS,
	PLAN_MODE_TOOLS,
} from "./harness-modes/active-tools.ts";
import { type BashRiskLevel, classifyBashRisk, isSafePlanBash } from "./harness-modes/bash-risk.ts";
import {
	getRepiHarnessModesHandle,
	installRepiHarnessModes,
	type RepiHarnessModesHandle,
} from "./harness-modes/install.ts";
import { extractPlanTodos, markPlanTodosDone } from "./harness-modes/plan-todos.ts";
import {
	createHarnessModeState,
	type RepiHarnessModeState,
	type RepiPermissionMode,
	type RepiPlanTodo,
} from "./harness-modes/types.ts";

export type { RepiPermissionMode, RepiPlanTodo, RepiHarnessModeState, BashRiskLevel, RepiHarnessModesHandle };
export {
	classifyBashRisk,
	isSafePlanBash,
	extractPlanTodos,
	markPlanTodosDone,
	createHarnessModeState,
	PLAN_MODE_TOOLS,
	ACCEPT_EDITS_TOOLS,
	CORE_ACTIVE_TOOLS,
	DOMAIN_ACTIVE_TOOLS,
	installRepiHarnessModes,
	getRepiHarnessModesHandle,
};

/** Claude Code-style dynamic tool activation after route/domain selection. */
export function activateRepiToolsForRoute(domain: string, ctx?: ExtensionContext): string[] {
	const handle = getRepiHarnessModesHandle();
	if (!handle) return [];
	return handle.activateForRoute(domain, ctx);
}

export function getRepiHarnessStartupLines(): string[] {
	return getRepiHarnessModesHandle()?.startupPacketLines() ?? [];
}
