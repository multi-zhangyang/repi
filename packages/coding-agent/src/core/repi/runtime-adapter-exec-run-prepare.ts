/** Runtime adapter execution preflight (gate/runner/command). */

import {
	detectRuntimeAdapterIds,
	formatRuntimeAdapterExecutionGate,
	materializeRuntimeAdapterCommand,
} from "./runtime-adapter.ts";
import { appendEvidence, commandKnownTools, parseToolIndex } from "./runtime-adapter-exec-deps.ts";
import { buildRuntimeAdapterExecutionGate } from "./runtime-adapter-exec-gate.ts";
import { shellQuote } from "./target.ts";
import { repiResolvedToolPresent as resolvedToolPresent } from "./tool-presence.ts";

export type RuntimeAdapterPreparedRun =
	| { blocked: string }
	| {
			adapter: any;
			report: any;
			selectedRunner: "native" | "fallback";
			command: string;
			timeout: number;
			target: string;
	  };

export function prepareRuntimeAdapterExecution(options: {
	adapter?: string;
	target?: string;
	timeoutMs?: number;
}): RuntimeAdapterPreparedRun {
	const inferredAdapter = options.adapter ?? detectRuntimeAdapterIds(options.target)[0];
	const report = buildRuntimeAdapterExecutionGate(inferredAdapter ?? options.target);
	const adapter = report.adapters.find((row: any) => row.adapterId === inferredAdapter) ?? report.adapters[0];
	if (!adapter) return { blocked: "runtime_adapter_execution:\nstatus: missing\nnext: re_runtime_adapter show" };
	if (!options.target?.trim())
		return {
			blocked: `${formatRuntimeAdapterExecutionGate(report)}\n\nblocked: target_required\nnext: re_runtime_adapter run ${adapter.adapterId} <target>`,
		};
	const selectedRunner = adapter.present ? "native" : adapter.fallbackPresent ? "fallback" : undefined;
	if (!selectedRunner) {
		const missingTools = Array.from(new Set([adapter.tool, adapter.fallbackTool]));
		appendEvidence({
			kind: "runtime",
			title: `runtime-adapter blocked ${adapter.adapterId}`,
			fact: `RuntimeAdapterExecutionCheckV1 adapter=${adapter.adapterId} blocked=runner_unavailable native=${adapter.tool} fallback=${adapter.fallbackTool}`,
			command: `re_runtime_adapter run ${adapter.adapterId} ${options.target}`,
			verify: `re_bootstrap plan ${missingTools.join(" ")}`,
			confidence: "runtime:adapter-execution runner_preflight_blocked_no_synthetic_success",
		});
		return {
			blocked: `${formatRuntimeAdapterExecutionGate(report)}\n\nblocked: runner_unavailable adapter=${adapter.adapterId} native=${adapter.tool} fallback=${adapter.fallbackTool}\nevidence: runner_preflight_blocked_no_synthetic_success\nnext: re_bootstrap plan ${missingTools.join(" ")}`,
		};
	}
	const selectedTemplate = selectedRunner === "native" ? adapter.commandTemplate : adapter.fallbackCommandTemplate;
	const command = materializeRuntimeAdapterCommand(selectedTemplate, options.target);
	const index = parseToolIndex();
	// Presence probes (`command -v aws`) must not hard-block inventory adapters when optional CLIs are absent.
	const commandForToolProbe = command
		.replace(/\$\(\s*command\s+-v\s+[A-Za-z0-9_.+-]+\s*(?:\|\|\s*true)?\s*\)/g, "")
		.replace(/command\s+-v\s+[A-Za-z0-9_.+-]+/g, "")
		.replace(/\$\(\s*which\s+[A-Za-z0-9_.+-]+\s*(?:\|\|\s*true)?\s*\)/g, "")
		.replace(/\bwhich\s+[A-Za-z0-9_.+-]+/g, "");
	// Optional cloud CLIs are best-effort inventory probes; pure/host paths must still run.
	const optionalInventoryCli = new Set([
		"aws",
		"az",
		"gcloud",
		"kubectl",
		"docker",
		"helm",
		"terraform",
		"volatility3",
		"volatility",
		"vol",
		"frida",
		"frida-ps",
		"adb",
	]);
	const missingCommandTools = commandKnownTools(commandForToolProbe).filter((tool: any) => {
		if (optionalInventoryCli.has(String(tool).toLowerCase())) return false;
		return resolvedToolPresent(index, tool) === false;
	});
	if (missingCommandTools.length > 0) {
		appendEvidence({
			kind: "runtime",
			title: `runtime-adapter preflight ${adapter.adapterId}`,
			fact: `RuntimeAdapterExecutionCheckV1 adapter=${adapter.adapterId} blocked=command_tools_missing tools=${missingCommandTools.join(",")}`,
			command: `re_runtime_adapter run ${adapter.adapterId} ${options.target}`,
			verify: `re_bootstrap plan ${missingCommandTools.join(" ")}`,
			confidence: "runtime:adapter-execution command_preflight_blocked_no_synthetic_success",
		});
		return {
			blocked: `${formatRuntimeAdapterExecutionGate(report)}\n\nblocked: command_tools_missing adapter=${adapter.adapterId} tools=${missingCommandTools.join(",")}\nevidence: command_preflight_blocked_no_synthetic_success\ncommand: ${command}\nnext: re_bootstrap plan ${missingCommandTools.join(" ")}`,
		};
	}
	const timeout = Math.max(
		5000,
		Math.min(options.timeoutMs ?? Number(process.env.REPI_RUNTIME_ADAPTER_TIMEOUT_MS ?? 60000), 600000),
	);
	return {
		adapter,
		report,
		selectedRunner,
		command,
		timeout,
		target: options.target,
	};
}

export function runtimeAdapterExecShell(command: string, target: string): string {
	return `set +e\nexport REPI_ADAPTER_TARGET=${shellQuote(target)}\n${command}`;
}
