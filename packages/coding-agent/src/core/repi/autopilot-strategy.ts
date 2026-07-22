/** Autopilot bootstrap + execution strategy (tool-index aware). */

import {
	createBootstrapPlan,
	fallbackForMissingTools,
	missingToolsForCommand,
	parseToolIndex,
	recommendedToolsForRoute,
} from "./autopilot-deps.ts";
import type { LaneCommand, LaneCommandPack } from "./lane-commands/types.ts";
import type { PassiveMapContext } from "./passive-map.ts";
import type { RoutePlan } from "./routes.ts";
import type { AutopilotExecutionStrategy } from "./runtime-types/failure.ts";
import type { BootstrapPlan } from "./tool-index/types.ts";

export function autopilotBootstrapPlan(
	route: RoutePlan,
	pack?: LaneCommandPack,
	map?: PassiveMapContext,
): BootstrapPlan[] {
	return createBootstrapPlan(recommendedToolsForRoute(route, pack, map));
}
export function autopilotExecutionStrategy(
	pack: LaneCommandPack,
	bootstrapPlan: BootstrapPlan[],
): AutopilotExecutionStrategy {
	const index = parseToolIndex();
	const knownMissing = bootstrapPlan.filter((item: any) => item.known && !item.present).map((item: any) => item.tool);
	if (index.size === 0) {
		return {
			mode: "tool-index-missing",
			pack,
			missingTools: knownMissing,
			fallbacks: [],
			skipped: [],
			notes: [
				"tool-index 为空：autopilot 不做破坏性安装，也不盲目裁剪命令；建议先 re_tool_index refresh 或 re_bootstrap plan。",
			],
		};
	}
	const nextCommands: LaneCommand[] = [];
	const fallbacks: AutopilotExecutionStrategy["fallbacks"] = [];
	const skipped: AutopilotExecutionStrategy["skipped"] = [];
	for (const command of pack.commands) {
		const missing = missingToolsForCommand(command.command, index);
		if (missing.length === 0) {
			nextCommands.push(command);
			continue;
		}
		const fallback = fallbackForMissingTools(command, missing, pack, index);
		if (fallback) {
			nextCommands.push(fallback);
			fallbacks.push({ label: command.label, missing, command: fallback.command });
			continue;
		}
		skipped.push({ label: command.label, missing, command: command.command });
	}
	const mode =
		nextCommands.length === 0 ? "blocked" : fallbacks.length > 0 || skipped.length > 0 ? "degraded" : "direct";
	return {
		mode,
		pack: {
			...pack,
			commands: nextCommands,
			notes: [
				...pack.notes,
				`autopilot_execution_strategy: ${mode}`,
				fallbacks.length ? `fallback_count=${fallbacks.length}` : "fallback_count=0",
				skipped.length ? `skipped_count=${skipped.length}` : "skipped_count=0",
			],
		},
		missingTools: knownMissing,
		fallbacks,
		skipped,
		notes: [
			mode === "direct"
				? "tool-index 覆盖当前命令包：直接执行。"
				: mode === "blocked"
					? "所有候选命令都依赖缺失工具且没有可用 fallback；先执行 next_bootstrap_command 或提供等价工具。"
					: "已按 tool-index 将命令包降级：优先 fallback，无法替代的命令跳过。",
		],
	};
}
export { formatAutopilotBootstrap, formatAutopilotExecutionStrategy } from "./autopilot-strategy-format.ts";
