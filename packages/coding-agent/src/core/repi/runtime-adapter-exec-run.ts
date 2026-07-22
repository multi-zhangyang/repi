/** Runtime adapter execution run path (reverse proof capture). */
import type { ExtensionAPI } from "../extensions/types.ts";
import { captureRuntimeAdapterExecution } from "./runtime-adapter-exec-run-capture.ts";
import { prepareRuntimeAdapterExecution, runtimeAdapterExecShell } from "./runtime-adapter-exec-run-prepare.ts";

export async function runRuntimeAdapterExecution(
	pi: ExtensionAPI,
	options: { adapter?: string; target?: string; timeoutMs?: number },
): Promise<string> {
	const prepared = prepareRuntimeAdapterExecution(options);
	if ("blocked" in prepared) return prepared.blocked;
	const startedAt = new Date().toISOString();
	const result = await pi.exec("bash", ["-lc", runtimeAdapterExecShell(prepared.command, prepared.target)], {
		timeout: prepared.timeout,
	});
	const finishedAt = new Date().toISOString();
	return captureRuntimeAdapterExecution({
		adapter: prepared.adapter,
		selectedRunner: prepared.selectedRunner,
		command: prepared.command,
		target: prepared.target,
		startedAt,
		finishedAt,
		result,
	});
}
