/** Plan/permission tool_call gates for REPI harness modes. */
import type { ExtensionAPI, ToolCallEvent } from "../../../extensions/types.ts";
import { classifyBashRisk, isSafePlanBash } from "./bash-risk.ts";
import { bashCommandFromInput } from "./message-helpers.ts";
import type { RepiPermissionMode } from "./types.ts";

export function planModeToolGate(event: ToolCallEvent): { block: true; reason: string } | undefined {
	if (event.toolName === "edit" || event.toolName === "write") {
		return {
			block: true,
			reason: "Plan mode blocks file mutations. Use /plan execute after the plan is ready.",
		};
	}
	if (event.toolName === "bash") {
		const command = bashCommandFromInput(event.input);
		if (command && !isSafePlanBash(command)) {
			return {
				block: true,
				reason: "Plan mode blocks destructive/non-readonly bash. Use read-only probes or /plan execute.",
			};
		}
	}
	if (event.toolName === "re_swarm" || event.toolName === "re_subagent" || event.toolName === "re_autopilot") {
		return {
			block: true,
			reason: "Plan mode blocks autonomous execution workers. Finish the plan first.",
		};
	}
	return undefined;
}

export function permissionBashGate(
	pi: ExtensionAPI,
	event: ToolCallEvent,
	mode: RepiPermissionMode,
): { block: true; reason: string } | undefined {
	if (mode === "bypass") return undefined;
	if (event.toolName !== "bash") return undefined;
	const command = bashCommandFromInput(event.input);
	if (!command) return undefined;
	const risk = classifyBashRisk(command);
	if (risk === "destructive") {
		if (mode === "default" || mode === "acceptEdits") {
			return {
				block: true,
				reason: `Permission mode ${mode} blocks destructive bash (risk=${risk}). Use /permission bypass only with operator intent.`,
			};
		}
	}
	if (risk === "elevated" && mode === "default") {
		pi.appendEntry("repi-bash-elevated", {
			timestamp: Date.now(),
			risk,
			command: command.slice(0, 400),
			mode,
		});
	}
	return undefined;
}
