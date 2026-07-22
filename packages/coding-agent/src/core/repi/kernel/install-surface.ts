/**
 * Lean-gated registration helpers for REPI tools/commands.
 */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { isRepiFullSurface, REPI_LEAN_COMMAND_ALLOW, REPI_LEAN_TOOL_ALLOW } from "./lean-surface.ts";

export function createRepiCommandRegistrar(pi: ExtensionAPI) {
	return (name: string, options: Parameters<ExtensionAPI["registerCommand"]>[1]) => {
		if (!isRepiFullSurface() && !REPI_LEAN_COMMAND_ALLOW.has(name)) return;
		pi.registerCommand(name, options);
	};
}

export function createRepiToolRegistrar(pi: ExtensionAPI) {
	return (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => {
		if (!isRepiFullSurface() && !REPI_LEAN_TOOL_ALLOW.has(tool.name)) return;
		pi.registerTool(tool);
	};
}
