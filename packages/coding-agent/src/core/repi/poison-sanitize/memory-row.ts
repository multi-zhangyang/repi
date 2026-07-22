/** Sanitize memory deposition rows/commands/lists. */
import { uniqueNonEmpty } from "../text.ts";
import { containsRepiPoison, normalizeHistoricalCommand, sanitizeTargetForCommand } from "./config.ts";
import {
	redactMemorySensitiveText,
	sanitizeMemoryCaseSignature,
	sanitizeMemoryRoute,
	sanitizeMemoryText,
} from "./text.ts";

export function sanitizeMemoryCommands(values?: string[], limit = 40): string[] {
	return uniqueNonEmpty(
		(values ?? [])
			.map((value: any) => normalizeHistoricalCommand(redactMemorySensitiveText(value), undefined, undefined))
			.filter((value): value is string => Boolean(value)),
		limit,
	);
}

export function sanitizeMemoryList(values?: string[], limit = 40): string[] {
	return uniqueNonEmpty(
		(values ?? []).map((value: any) => sanitizeMemoryText(value)).filter((value): value is string => Boolean(value)),
		limit,
	);
}

export function sanitizeMemoryDepositionRow(event: any): any | undefined {
	if (containsRepiPoison(JSON.stringify(event))) return undefined;
	const task = sanitizeMemoryText(event.task, "runtime memory deposition") ?? "runtime memory deposition";
	const route = sanitizeMemoryRoute(event.route, "runtime");
	const target = sanitizeTargetForCommand(event.target);
	const row: any = {
		...event,
		task,
		route,
		target,
		command: event.command ? normalizeHistoricalCommand(event.command, undefined, undefined) : undefined,
		lessons: sanitizeMemoryList(event.lessons, 40),
		failurePatterns: sanitizeMemoryList(event.failurePatterns, 40),
		reuseRules: sanitizeMemoryList(event.reuseRules, 40),
		commands: sanitizeMemoryCommands(event.commands, 40),
		reason:
			sanitizeMemoryText(event.reason, "runtime step captured by MemoryDepositionEngineV7") ??
			"runtime step captured by MemoryDepositionEngineV7",
		caseSignature: sanitizeMemoryCaseSignature(event.caseSignature),
		entryHash: "",
	};
	return row;
}
