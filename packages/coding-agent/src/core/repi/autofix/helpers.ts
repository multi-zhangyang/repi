/** Autofix pure helpers. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import {
	buildReplayer,
	latestReplayerArtifactPath,
	parseReplayArtifact,
	writeReplayerArtifact,
} from "../replayer-runtime.ts";
import type { ReplayArtifact } from "../runtime-types/verifier-replay.ts";
import { evidenceAutofixDir, readTextFile as readText } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";
import type { AutofixArtifact, AutofixItem, AutofixItemKind, AutofixReplayView } from "./types.ts";

export function latestAutofixArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("autofix", evidenceAutofixDir(), options);
}

export function autofixItem(
	kind: AutofixItemKind,
	source: string,
	reason: string,
	command: string,
	sourceArtifacts: string[],
	index: number,
): AutofixItem {
	return {
		id: `fix:${kind}:${index + 1}:${slug(source).slice(0, 18)}`,
		kind,
		source: truncateMiddle(source, 360),
		reason: truncateMiddle(reason, 360),
		command,
		status: "queued",
		sourceArtifacts,
	};
}

export function replayFailureRows(replay: AutofixReplayView): string[] {
	const failed = replay.executions
		.filter((execution: any) => execution.status === "failed")
		.map(
			(execution: any) =>
				`${execution.stepId}: exit=${execution.exit} command=${execution.command} stderr=${truncateMiddle(execution.stderrHead, 240)}`,
		);
	return Array.from(new Set([...replay.blocked, ...failed])).slice(0, 40);
}

export function bootstrapToolFromCommand(command: string): string | undefined {
	const token = command
		.trim()
		.split(/\s+/)[0]
		?.replace(/^['"]|['"]$/g, "");
	if (!token || /^(set|test|cat|printf|sed|grep|rg|awk|bash|sh|python|node)$/i.test(token)) return undefined;
	return token;
}

export function latestOrBuildReplay(options: { target?: string } = {}): { replay: ReplayArtifact; path: string } {
	const latest = !options.target ? latestReplayerArtifactPath() : undefined;
	if (latest) {
		const replay = parseReplayArtifact(latest);
		if (replay) return { replay, path: latest };
	}
	const replay = buildReplayer({ target: options.target, mode: "plan" });
	const path = writeReplayerArtifact(replay);
	return { replay, path };
}

export function parseAutofixArtifact(path: string): AutofixArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as AutofixArtifact;
	} catch {
		return undefined;
	}
}
