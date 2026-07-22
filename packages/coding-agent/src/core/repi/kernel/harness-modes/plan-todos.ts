/** Plan todo extraction for /plan harness mode. */
import type { RepiPlanTodo } from "./types.ts";

export function extractPlanTodos(message: string): RepiPlanTodo[] {
	const todos: RepiPlanTodo[] = [];
	const planSection = /(?:^|\n)\s*(?:Plan|计划|任务树)\s*[:：]\s*\n([\s\S]*?)(?:\n\s*\n|$)/i.exec(message);
	const body = planSection?.[1] ?? message;
	for (const match of body.matchAll(/^\s*(?:\d+[).:-]|[-*])\s+(.+)$/gm)) {
		const text = match[1]?.trim();
		if (!text || text.length > 240) continue;
		if (/^outcome|^key evidence|^verification|^next step/i.test(text)) continue;
		todos.push({ text, completed: false });
		if (todos.length >= 20) break;
	}
	return todos;
}

export function markPlanTodosDone(message: string, todos: RepiPlanTodo[]): number {
	let changed = 0;
	for (const match of message.matchAll(/\[DONE:(\d+)\]/gi)) {
		const index = Number(match[1]) - 1;
		if (Number.isInteger(index) && todos[index] && !todos[index].completed) {
			todos[index].completed = true;
			changed += 1;
		}
	}
	return changed;
}
