/** Goal prompt/objective parsing helpers. */
import type { AgentMessage } from "@pi-recon/repi-agent-core";
import { formatBudget, formatTokenCount, goalObjectiveBlock, goalPersistenceRules } from "./format.ts";
import { continuationMarkerComment, isAgentStopReason } from "./state.ts";
import type { AssistantMessageLike, RepiGoalCommandResult, RepiGoalState } from "./types.ts";
import { MAX_OBJECTIVE_LENGTH } from "./types.ts";
export function buildGoalPrompt(goal: RepiGoalState): string {
	const budgetLine = goal.tokenBudget === undefined ? "" : `\nToken budget: ${formatTokenCount(goal.tokenBudget)}.`;
	return `REPI goal mode is active. Complete this goal fully:\n\n${goalObjectiveBlock(goal)}${budgetLine}\n\n${goalPersistenceRules("this goal")}`;
}
export function buildObjectiveUpdatedPrompt(goal: RepiGoalState): string {
	const budgetLine = goal.tokenBudget === undefined ? "" : `\nToken budget: ${formatBudget(goal)} used.`;
	return `The active REPI /goal objective was updated. Continue working toward this goal:\n\n${goalObjectiveBlock(goal)}${budgetLine}\n\n${goalPersistenceRules("the updated goal")}`;
}
export function buildResumePrompt(goal: RepiGoalState): string {
	const budgetLine = goal.tokenBudget === undefined ? "" : `\nToken budget: ${formatBudget(goal)} used.`;
	return `The user explicitly resumed the paused REPI /goal. Continue working toward this goal:\n\n${goalObjectiveBlock(goal)}${budgetLine}\n\n${goalPersistenceRules("this goal")}`;
}
export function buildGoalSystemPrompt(goal: RepiGoalState): string {
	const budgetLine =
		goal.tokenBudget === undefined ? "" : `\n- Respect the goal token budget (${formatBudget(goal)} used).`;
	return `Active REPI /goal:\n${goalObjectiveBlock(goal)}\n\nGoal-mode rules:\n- Keep going until the active goal is completely resolved end-to-end.\n- Treat the current worktree, command output, tests, runtime behavior, network responses, and external state as authoritative.\n- Do not redefine the goal into a smaller task; audit every requirement before completion.\n- Do not stop at analysis, a plan, TODO list, partial fixes, or suggested next steps.\n- Autonomously perform implementation and verification with the available tools when they are needed to complete the goal.\n- Persevere through recoverable tool/provider failures by trying reasonable alternatives instead of yielding early.\n- If the goal is not complete at the end of a turn, expect an automatic continuation and keep working from where you left off.\n- Only call goal_complete after the goal is fully complete and verified.${budgetLine}`;
}
export function buildContinuePrompt(goal: RepiGoalState, marker: string): string {
	return `Continue the active REPI /goal until it is complete:\n\n${goalObjectiveBlock(goal)}\n\nThis is automatic continuation #${goal.iteration}. Current files, command output, tests, runtime behavior, network responses, and external state are authoritative; re-check them as needed. ${goalPersistenceRules("this goal")}\n\n${continuationMarkerComment(marker)}`;
}
export function parseObjective(kind: "start" | "edit", tokens: string[]): RepiGoalCommandResult | string {
	let tokenBudget: number | undefined;
	const objectiveTokens = [...tokens];
	if (objectiveTokens[0] === "--tokens") {
		const rawBudget = objectiveTokens[1];
		if (!rawBudget) return "Usage: /goal --tokens 100k <goal_to_complete>";
		const parsedBudget = parseTokenBudget(rawBudget);
		if (parsedBudget === undefined) return `Invalid token budget: ${rawBudget}`;
		tokenBudget = parsedBudget;
		objectiveTokens.splice(0, 2);
	}
	if (objectiveTokens.length === 0) {
		return kind === "edit" ? "Usage: /goal edit <goal_to_complete>" : "Usage: /goal <goal_to_complete>";
	}
	return { kind, objective: objectiveTokens.join(" "), tokenBudget };
}
export function tokenize(input: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let quote: '"' | "'" | undefined;
	for (const char of input) {
		if (quote) {
			if (char === quote) quote = undefined;
			else current += char;
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}
		if (/\s/.test(char)) {
			if (current) tokens.push(current);
			current = "";
			continue;
		}
		current += char;
	}
	if (current) tokens.push(current);
	return tokens;
}
export function parseTokenBudget(value: string): number | undefined {
	const match = /^(\d+(?:\.\d+)?)([km])?$/iu.exec(value.trim());
	if (!match) return undefined;
	const amount = Number(match[1]);
	if (!Number.isFinite(amount) || amount <= 0) return undefined;
	const multiplier = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2]?.toLowerCase() === "k" ? 1_000 : 1;
	return Math.floor(amount * multiplier);
}
export function validateObjective(objective: string): string | undefined {
	const trimmed = objective.trim();
	if (!trimmed) return "Usage: /goal <goal_to_complete>";
	if (trimmed.length > MAX_OBJECTIVE_LENGTH) {
		return `Goal objective is too long (${trimmed.length}/${MAX_OBJECTIVE_LENGTH} characters). Put long instructions in a file and reference it from /goal instead.`;
	}
	return undefined;
}
export function findFinalAssistantMessage(messages: AgentMessage[] | unknown[]): AssistantMessageLike | undefined {
	for (let index = messages.length - 1; index >= 0; index--) {
		const message = messages[index];
		if (!message || typeof message !== "object") continue;
		const candidate = message as Record<string, unknown>;
		if (candidate.role !== "assistant") continue;
		return {
			role: "assistant",
			stopReason: isAgentStopReason(candidate.stopReason) ? candidate.stopReason : undefined,
			errorMessage: typeof candidate.errorMessage === "string" ? candidate.errorMessage : undefined,
			usage: candidate.usage,
		};
	}
	return undefined;
}
