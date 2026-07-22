/** Goal formatting helpers. */
import type { RepiGoalContext, RepiGoalState, RepiGoalStatus } from "./types.ts";
export function formatGoalFooterStatus(goal: RepiGoalState | undefined): string | undefined {
	const status = formatGoalStatus(goal);
	return status ? `🎯 ${status}` : undefined;
}
export function formatGoalStatus(goal: RepiGoalState | undefined): string | undefined {
	if (!goal) return undefined;
	if (goal.status === "complete") return "complete";
	if (goal.status === "paused") return "paused";
	if (goal.status === "budget_limited") return `budget ${formatBudget(goal)}`;
	if (goal.tokenBudget !== undefined) return `active ${formatBudget(goal)}`;
	return `active ${formatDuration(goal.timeUsedSeconds)}`;
}
export function formatBudget(goal: RepiGoalState): string {
	return `${formatTokenCount(goal.tokensUsed)}/${formatTokenCount(goal.tokenBudget ?? 0)}`;
}
export function formatGoalProgressBar(percent: number): string {
	const bounded = Math.max(0, Math.min(100, Math.floor(percent)));
	const filled = Math.max(0, Math.min(10, Math.floor(bounded / 10)));
	return `[${"█".repeat(filled)}${"░".repeat(10 - filled)}]`;
}
export function goalProgressLine(goal: RepiGoalState): string {
	if (goal.tokenBudget === undefined) {
		return `Progress: elapsed=${formatDuration(goal.timeUsedSeconds)} tokens=${formatTokenCount(goal.tokensUsed)}`;
	}
	const percent = goal.tokenBudget <= 0 ? 100 : Math.min(100, Math.floor((goal.tokensUsed / goal.tokenBudget) * 100));
	const remaining = Math.max(0, goal.tokenBudget - goal.tokensUsed);
	return `Budget: ${formatGoalProgressBar(percent)} ${percent}% used (${formatTokenCount(remaining)} remaining)`;
}
export function goalSummary(goal: RepiGoalState): string {
	const footer = formatGoalFooterStatus(goal) ?? "🎯 <clear>";
	return [
		"🎯 REPI Goal Status",
		`Goal: ${goal.text}`,
		`Status: ${goal.status}`,
		`Footer: ${footer}`,
		`Iteration: ${goal.iteration}`,
		`Elapsed: ${formatDuration(goal.timeUsedSeconds)}`,
		`Tokens: ${goal.tokenBudget === undefined ? formatTokenCount(goal.tokensUsed) : formatBudget(goal)}`,
		goalProgressLine(goal),
		"Completion gate: goal_complete only after verified completion",
		`Next: ${goalCommandHint(goal.status)}`,
	].join("\n");
}
export function emptyGoalSummary(): string {
	return [
		"🎯 REPI Goal Status",
		"Status: clear",
		"Footer: 🎯 <clear>",
		"No goal is currently set.",
		"Usage: /goal <objective>",
		"Next: /goal [--tokens 100k] <objective>",
	].join("\n");
}
export function goalCommandHint(status: RepiGoalStatus): string {
	if (status === "active") return "/goal edit <objective>, /goal pause, /goal clear";
	if (status === "paused") return "/goal edit <objective>, /goal resume, /goal clear";
	return "/goal edit <objective>, /goal clear";
}
export function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h${minutes % 60}m`;
}
export function formatTokenCount(value: number): string {
	if (value < 1_000) return `${value}`;
	if (value < 1_000_000) return `${Number.isInteger(value / 1_000) ? value / 1_000 : (value / 1_000).toFixed(1)}k`;
	return `${Number.isInteger(value / 1_000_000) ? value / 1_000_000 : (value / 1_000_000).toFixed(1)}m`;
}
export function currentTokenTotal(ctx: RepiGoalContext): number {
	const branch = ctx.sessionManager.getBranch?.() ?? ctx.sessionManager.getEntries?.() ?? [];
	let total = 0;
	for (const entry of branch) {
		if (entry.type !== "message" || entry.message.role !== "assistant") continue;
		const usage = entry.message.usage as { input?: number; output?: number } | undefined;
		total += usage?.input ?? 0;
		total += usage?.output ?? 0;
	}
	return total;
}
export function goalObjectiveBlock(goal: RepiGoalState): string {
	return `<goal_objective>\n${escapeXmlText(goal.text)}\n</goal_objective>`;
}
export function goalPersistenceRules(goalLabel: string): string {
	return `Keep going until ${goalLabel} is completely resolved end-to-end. Do not redefine ${goalLabel} into a smaller task. Do not stop at analysis, a plan, TODO list, partial fixes, or suggested next steps. Autonomously perform implementation and verification with the available tools when they are needed. Treat current files, command output, tests, runtime behavior, network responses, and external state as authoritative. If a tool call or provider call fails, try reasonable alternatives instead of yielding early. Before calling goal_complete, audit ${goalLabel} requirement by requirement against the verified current state. Only call goal_complete after ${goalLabel} is fully complete and verified.`;
}
export function formatError(error: unknown): string {
	return truncateNotification(error instanceof Error ? error.message : String(error));
}
export function escapeXmlText(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function truncateNotification(value: string): string {
	return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}
export function escapeRegExpText(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
