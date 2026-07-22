/** Operator feedback/parse helpers. */

import type { ArtifactScopeFilterOptions } from "../artifact-scope-types.ts";
import { evidenceOperatorsDir, readTextFile as readText } from "../storage.ts";
import { shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";
import { bootstrapToolFromCommand } from "./feedback-next.ts";

export function operatorFeedbackToolHint(text: string, command: string): string | undefined {
	const commandNotFound =
		/(?:command not found|not found|No such file or directory|cannot stat|ModuleNotFoundError|ImportError)[:\s]+([A-Za-z0-9_.+:-]+)/i.exec(
			text,
		)?.[1];
	const raw = commandNotFound ?? bootstrapToolFromCommand(command);
	if (!raw) return undefined;
	return raw
		.replace(/^['"]|['"]$/g, "")
		.split(/[/:]/)
		.pop();
}

export function operatorFeedbackRow(params: {
	category: string;
	execution?: any;
	command?: string;
	status?: string;
	next: string;
	evidence: string;
	operatorArtifact?: string;
}): string {
	const command = params.execution?.command ?? params.command ?? "none";
	const status = params.execution?.status ?? params.status ?? "unknown";
	const step = params.execution?.stepId ? ` step=${params.execution.stepId}` : "";
	return [
		`category=${params.category}`,
		`status=${status}`,
		step.trim(),
		`command=${shellQuote(truncateMiddle(command, 180))}`,
		`next=${params.next}`,
		`evidence=${shellQuote(truncateMiddle(params.evidence, 260))}`,
		params.operatorArtifact ? `source=${params.operatorArtifact}` : undefined,
	]
		.filter(Boolean)
		.join(" ");
}

export function parseOperatorArtifact(path: string): any | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as any;
	} catch {
		return undefined;
	}
}

export function parseShellQuotedValue(value: string | undefined): string | undefined {
	if (!value) return undefined;
	return value.replace(/'\\''/g, "'");
}

export function latestOperatorArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("operator", evidenceOperatorsDir(), options);
}
