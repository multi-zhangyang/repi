/** Reverse install surface: tools. */
/**
 * Reverse/pentest tool registration (techniques + runtime tools).
 * Builders/runners stay in profile-runtime; this module only registers tools via domain modules.
 */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export type { ReverseRuntimeToolDeps } from "./types.ts";

import { registerRepiReverseAdapterTools } from "./tools-adapter.ts";
import { registerRepiReverseNativeTools } from "./tools-native.ts";
import { registerRepiReverseWebTools } from "./tools-web.ts";

export function registerRepiReverseRuntimeTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	// Product reverse gate: catalog technique.proofExit alone is insufficient; runtime capture + bind_ready required.
	// Reverse product gate: runtime capture (partial/strong) + bind_ready required before claim.
	registerRepiReverseWebTools(registerTool, pi, deps);
	registerRepiReverseNativeTools(registerTool, pi, deps);
	registerRepiReverseAdapterTools(registerTool, pi, deps);
}
