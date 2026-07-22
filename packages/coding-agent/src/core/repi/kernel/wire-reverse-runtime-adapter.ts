/** Wire-reverse: configureRuntimeAdapterExec bag. */

import { appendEvidence } from "../evidence.ts";
import { configureRuntimeAdapterExec } from "../runtime-adapter-exec-deps.ts";
import { parseToolIndex } from "../tool-index/catalog-core.ts";
import { commandKnownTools } from "../tool-index/catalog-tools.ts";
import type { PickFn } from "./wire-pick.ts";

/**
 * Fallbacks MUST be concrete implementations.
 * Never pass runtime-adapter-exec DI stubs (appendEvidence → deps → appendEvidence recursion).
 */
export function wireRuntimeAdapterExecConfigure(pick: PickFn): void {
	configureRuntimeAdapterExec({
		appendEvidence: pick("appendEvidence", appendEvidence),
		parseToolIndex: pick("parseToolIndex", parseToolIndex),
		commandKnownTools: pick("commandKnownTools", commandKnownTools),
	});
}
