/** Tool-bootstrap closure runner. */

import { readTextFile as readText } from "./evidence.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import { toolIndexPath } from "./storage.ts";
import { truncateMiddle } from "./text.ts";
import { refreshToolIndex } from "./tool-bootstrap-deps.ts";
import { adaptiveSourceLaneName, bootstrapToolsFromLane, markToolBootstrapClosure } from "./tool-bootstrap-pure.ts";
import { createBootstrapPlan, formatBootstrapPlan, installBootstrapTools } from "./tool-index.ts";

export async function runToolBootstrapClosure(pi: any, params: { lane: any; text: string }): Promise<any | undefined> {
	if (params.lane.name !== "tool-bootstrap") return undefined;
	const sourceLane = adaptiveSourceLaneName(params.lane);
	const tools = bootstrapToolsFromLane(params.lane, params.text);
	const installRequested = /\bre_bootstrap\s+install\b/.test(params.lane.next.join("\n"));
	const bootstrapExecution = installRequested && tools.length > 0 ? await installBootstrapTools(pi, tools) : undefined;
	const refreshed = bootstrapExecution ? readText(toolIndexPath()) : await refreshToolIndex(pi);
	const plan = tools.length > 0 ? createBootstrapPlan(tools) : [];
	const missing = plan.filter((item: any) => item.known && !item.present).map((item: any) => item.tool);
	markToolBootstrapClosure({
		laneName: params.lane.name,
		sourceLane,
		tools,
		missing,
		refreshedPath: toolIndexPath(),
	});
	const reverseHeavy = /native|pwn|malware|firmware|reverse|binary|exploit|mobile|gdb|frida|r2/i.test(
		`${sourceLane ?? ""} ${params.lane.note ?? ""} ${params.text}`,
	);
	const reverseNext =
		reverseHeavy && missing.length > 0
			? reverseDomainCaptureNextCommands({
					routeOrBlob: `${sourceLane ?? ""} ${missing.join(" ")} tool-bootstrap`,
					includeGates: true,
				}).slice(0, 2)
			: [];
	const text = [
		"tool_bootstrap_closure:",
		`tools: ${tools.join(", ") || "none"}`,
		`install_requested: ${installRequested ? "true" : "false"}`,
		`refreshed_tool_index: ${toolIndexPath()}`,
		`missing_after_refresh: ${missing.join(", ") || "none"}`,
		sourceLane ? `resumed_lane: ${missing.length === 0 ? sourceLane : "none"}` : "resumed_lane: none",
		missing.length > 0
			? `next_bootstrap_command: re_bootstrap install ${missing.join(" ")}`
			: "next_bootstrap_command: none",
		...(reverseNext.length ? ["reverse_next:", ...reverseNext.map((cmd: any) => `- ${cmd}`)] : []),
		"",
		"bootstrap_plan_after_refresh:",
		formatBootstrapPlan(plan),
		...(bootstrapExecution ? ["", "bootstrap_execution:", truncateMiddle(bootstrapExecution, 6000)] : []),
		"",
		"refreshed_tool_index_tail:",
		truncateMiddle(refreshed, 3000),
	].join("\n");
	if (tools.length === 0) {
		return {
			text,
			decision: { action: "stop", reason: `tool_bootstrap_no_tools:${params.lane.name}` },
		};
	}
	if (missing.length > 0) {
		return {
			text,
			decision: {
				action: "stop",
				reason: `tool_bootstrap_incomplete:${missing.join(",")}`,
			},
		};
	}
	return {
		text,
		decision: {
			action: "continue_next",
			reason: `tool_bootstrap_closed:${sourceLane ?? params.lane.name}`,
			nextLane: sourceLane,
		},
		nextLane: sourceLane,
	};
}
