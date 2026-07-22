import { readCurrentMission } from "../mission.ts";
import { formatRepiRoute as formatRoute } from "../routes.ts";
/**
 * Small REPI session/display helpers used by profile hooks and factory.
 */
import { envBoolean } from "../text.ts";

const RECON_SOURCE = "repi";

function missionCheckSummary(): string {
	const mission = readCurrentMission();
	if (!mission) return "no mission";
	return mission.checkpoints.map((checkpoint: any) => `${checkpoint.name}=${checkpoint.status}`).join(", ");
}

export function allowNoSessionReconWriteback(): boolean {
	return envBoolean("REPI_RUNTIME_WRITEBACK_NO_SESSION") ?? envBoolean("REPI_MEMORY_WRITEBACK_NO_SESSION") ?? false;
}

export function makeSelfReview(stats: any): string {
	return [
		"<self_review>",
		`目标推进证据：${stats.lastRoute ? formatRoute(stats.lastRoute) : "未记录路由"}; tool_calls=${stats.calls}; bash_calls=${stats.bashCalls}; failures=${stats.failures}`,
		`任务黑板：mission=${stats.currentMissionId ?? "none"}; checkpoints=${missionCheckSummary()}`,
		`重复/死循环检查：last_commands=${stats.lastCommands.slice(-3).join(" | ") || "none"}; repeated=${stats.repeatedCommandCount}`,
		"上个错误解释：如 failures 增长，先解释 stderr/exit code，再换路线。",
		"下一条路线：被动证据不足→补映射；静态卡住→动态/trace/hook；源码与运行时冲突→信运行时。",
		"</self_review>",
	].join("\n");
}

export function sendDisplayMessage(pi: any, title: string, body: string): void {
	pi.sendMessage({
		customType: "repi",
		content: `## ${title}\n\n${body}`,
		display: true,
		details: { source: RECON_SOURCE, title },
	});
}

export function getToolResultCommand(event: any): string | undefined {
	const input = event.input as {
		command?: unknown;
		cmd?: unknown;
		action?: unknown;
		query?: unknown;
		target?: unknown;
	};
	const command = input.command ?? input.cmd;
	if (typeof command === "string" && command.trim()) return command.trim();
	const args = [input.action, input.query, input.target]
		.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
		.join(" ");
	return args ? `${event.toolName} ${args}` : event.toolName;
}
export function getBashCommand(event: any): string | undefined {
	if (event.toolName !== "bash") return undefined;
	const input = event.input as { command?: unknown; cmd?: unknown };
	const command = input.command ?? input.cmd;
	return typeof command === "string" ? command.trim() : undefined;
}
