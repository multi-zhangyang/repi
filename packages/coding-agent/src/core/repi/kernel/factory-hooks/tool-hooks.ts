/** Tool call/result session hooks. */
// Landmark: registerRepiToolHooks tool_call tool_result reverse runtime writeback
import { registerRepiToolCallHook } from "./tool-hooks-call.ts";
import { registerRepiToolResultHook } from "./tool-hooks-result.ts";

export function registerRepiToolHooks(pi: any, stats: any, d: Record<string, any>): void {
	registerRepiToolCallHook(pi, stats, d);
	registerRepiToolResultHook(pi, stats, d);
}
