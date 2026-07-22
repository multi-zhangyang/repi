/** Wire-reverse: configureRuntimeAdapterExec bag. */

import {
	appendEvidence,
	commandKnownTools,
	configureRuntimeAdapterExec,
	parseToolIndex,
} from "../runtime-adapter-exec-deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireRuntimeAdapterExecConfigure(pick: PickFn): void {
	configureRuntimeAdapterExec({
		appendEvidence: pick("appendEvidence", appendEvidence),
		parseToolIndex: pick("parseToolIndex", parseToolIndex),
		commandKnownTools: pick("commandKnownTools", commandKnownTools),
	});
}
