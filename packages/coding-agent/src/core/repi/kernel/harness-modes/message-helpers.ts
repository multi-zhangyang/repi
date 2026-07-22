/** Harness mode small message/UI helpers. */
import type { RepiHarnessModeState } from "./types.ts";

export function footerLabel(state: RepiHarnessModeState): string {
	if (state.permissionMode === "plan") {
		const done = state.planTodos.filter((item: any) => item.completed).length;
		return state.planTodos.length ? `plan ${done}/${state.planTodos.length}` : "plan";
	}
	if (state.permissionMode === "acceptEdits") return "acceptEdits";
	if (state.permissionMode === "bypass") return "bypass";
	return "default";
}

export function bashCommandFromInput(input: unknown): string {
	if (!input || typeof input !== "object") return "";
	const record = input as Record<string, unknown>;
	const command = record.command ?? record.cmd;
	return typeof command === "string" ? command.trim() : "";
}

export function assistantTextFromMessageEnd(event: unknown): string {
	if (!event || typeof event !== "object") return "";
	const record = event as Record<string, unknown>;
	const message = record.message;
	if (!message || typeof message !== "object") return "";
	const msg = message as Record<string, unknown>;
	if (msg.role !== "assistant") return "";
	const content = msg.content;
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	const parts: string[] = [];
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		const row = block as Record<string, unknown>;
		if (row.type === "text" && typeof row.text === "string") parts.push(row.text);
	}
	return parts.join("\n");
}
