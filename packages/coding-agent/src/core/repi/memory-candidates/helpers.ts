import { readTextFile as readText } from "../evidence.ts";
import { knowledgeCommandHints } from "../knowledge-graph.ts";
import { playbookBashBlocks } from "../playbooks.ts";
import { memoryPath } from "../storage.ts";
import { commandContainsPoison, escapeRegExp, shellQuote } from "../target.ts";
/** Memory candidate pure helpers (normalize/knowledge extract). */

export function normalizeHistoricalCommand(
	command: string,
	oldTarget: string | undefined,
	target: string | undefined,
): string | undefined {
	let normalized = command.trim();
	if (!normalized || /^re_lane\b|^re-lane\b|^run_auto_summary:/i.test(normalized)) return undefined;
	if (normalized.length > 1400) return undefined;
	if (commandContainsPoison(normalized)) return undefined;
	if (target) normalized = normalized.replace(/<TARGET>|<URL>/g, shellQuote(target));
	if (oldTarget && target) {
		normalized = normalized
			.replace(new RegExp(escapeRegExp(shellQuote(oldTarget)), "g"), shellQuote(target))
			.replace(new RegExp(escapeRegExp(oldTarget), "g"), target);
	}
	if (!target && oldTarget && normalized.includes(oldTarget)) return undefined;
	if (/[<][A-Z_]+[>]/.test(normalized)) return undefined;
	if (commandContainsPoison(normalized)) return undefined;
	return normalized;
}

export function knowledgeIndexSection(name: string): string[] {
	const text = readText(memoryPath("knowledge-graph-index.md"));
	const lines = text.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${name.toLowerCase()}`);
	if (start < 0) return [];
	const out: string[] = [];
	for (const line of lines.slice(start + 1)) {
		if (/^##\s+/.test(line)) break;
		const trimmed = line.trim().replace(/^- /, "");
		if (trimmed) out.push(trimmed);
	}
	return out;
}

export function extractKnowledgeCommands(text: string, oldTarget: string | undefined, target?: string): string[] {
	const codeCommands = playbookBashBlocks(text);
	const inlineCommands = [
		...knowledgeCommandHints(text),
		...Array.from(text.matchAll(/re[-_][\w-]+(?:\s+[^\s;&|]+){0,5}/gi)).map((match: any) => match[0] ?? ""),
	];
	return Array.from(new Set([...codeCommands, ...inlineCommands]))
		.map((command: any) =>
			normalizeHistoricalCommand(command, oldTarget === "<none>" ? undefined : oldTarget, target),
		)
		.filter((command): command is string => Boolean(command))
		.slice(0, 12);
}

export function compactResumeCaseMemoryCommands(row: string, target?: string): string[] {
	const targetRef = target?.trim() || "<target>";
	if (
		/status=(?:queued|blocked|partial)|compact_resume_repair|proof_loop_missing|proof_loop_entered=false/i.test(row)
	) {
		return [
			"re_context resume",
			`re_operator plan ${targetRef}`,
			`re_proof_loop run ${targetRef} 4 2`,
			"re_domain_proof_exit show",
		];
	}
	if (/status=done|compact_resume_success|resume_contract_survived=true|proof_loop_entered=true/i.test(row)) {
		return [
			`re_knowledge_graph build ${targetRef}`,
			"re_domain_proof_exit show",
			"re_context pack",
			"re_complete audit",
		];
	}
	return [];
}
