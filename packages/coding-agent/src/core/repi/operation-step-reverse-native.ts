/** Operation reverse steps: native/exploit/tool-index/graph/chain/campaign. */
import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperationReverseNativeStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const nativeRuntimeMatch = /^re[-_]native[-_]runtime\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (nativeRuntimeMatch) {
		const action = (nativeRuntimeMatch[1] as "plan" | "show" | "run") ?? "run";
		const nativeTarget = nativeRuntimeMatch[2]?.trim() || target;
		const timeoutMs = nativeRuntimeMatch[3] ? Number(nativeRuntimeMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runNativeRuntime(pi, { target: nativeTarget, timeoutMs })
				: d().buildNativeRuntimeOutput(action, { target: nativeTarget, timeoutMs }),
		);
	}
	const exploitLabMatch =
		/^re[-_]exploit[-_]lab\s+(plan|show|run|bundle)?(?:\s+(.+?))?(?:\s+(\d+))?(?:\s+(\d+))?$/i.exec(command);
	if (exploitLabMatch) {
		const action = (exploitLabMatch[1] as "plan" | "show" | "run" | "bundle") ?? "run";
		const labTarget = exploitLabMatch[2]?.trim() || target;
		const runs = exploitLabMatch[3] ? Number(exploitLabMatch[3]) : undefined;
		const timeoutMs = exploitLabMatch[4] ? Number(exploitLabMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runExploitLab(pi, { target: labTarget, runs, timeoutMs })
				: d().buildExploitLabOutput(action, { target: labTarget, runs, timeoutMs }),
		);
	}
	if (/^re_tool_index\s+refresh$/i.test(command) || /^re-tools\s+refresh$/i.test(command)) {
		return done(await d().refreshToolIndex(pi));
	}
	if (/^re_graph\s+build$/i.test(command)) return done(d().buildAttackGraphOutput("build"));
	if (/^re[-_](?:exploit[-_])?chain\s+(plan|compose)\b/i.test(command)) {
		const action = /^re[-_](?:exploit[-_])?chain\s+compose\b/i.test(command) ? "compose" : "plan";
		const chainTarget = command.replace(/^re[-_](?:exploit[-_])?chain\s+(?:plan|compose)\b/i, "").trim() || target;
		return done(d().buildExploitChainOutput(action, { target: chainTarget }));
	}
	if (/^re_campaign\s+show$/i.test(command)) return done(d().buildCampaignOutput("show"));
	if (/^re_campaign\s+plan\b/i.test(command)) return done(d().buildCampaignOutput("plan", { target }));
	return undefined;
}
