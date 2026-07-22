/** Latest operator feedback aggregation. */
import { existsSync } from "node:fs";
import { latestAutofixArtifactPath, parseAutofixArtifact } from "../autofix.ts";
import { latestCompilerArtifactPath, parseCompilerArtifact } from "../compiler-runtime.ts";
import { parseReplayArtifact } from "../replayer-runtime.ts";
import { latestVerifierArtifactPath, parseVerifierArtifact } from "../verifier-runtime.ts";
import { artifactTargetMatches, latestReplayerArtifactPath } from "./deps.ts";
import { operatorCommandConcrete, operatorFeedbackNextCommands } from "./feedback-next.ts";

export function latestOperatorFeedback(target?: string): {
	rows: string[];
	commands: string[];
	sourceArtifacts: string[];
} {
	const scope = target ? { target, requestedBy: "operator_feedback_latest_artifact_consumer" } : {};
	const specs: Array<
		[
			string | undefined,
			(path: string) => { target?: string; operatorFeedback?: string[] } | undefined,
			"scoped" | "fallback",
		]
	> = [
		[latestAutofixArtifactPath(scope), parseAutofixArtifact, "scoped"],
		[latestReplayerArtifactPath(scope), parseReplayArtifact, "scoped"],
		[latestCompilerArtifactPath(scope), parseCompilerArtifact, "scoped"],
		[latestVerifierArtifactPath(scope), parseVerifierArtifact, "scoped"],
		...(target
			? ([
					[latestAutofixArtifactPath(), parseAutofixArtifact, "fallback"],
					[latestReplayerArtifactPath(), parseReplayArtifact, "fallback"],
					[latestCompilerArtifactPath(), parseCompilerArtifact, "fallback"],
					[latestVerifierArtifactPath(), parseVerifierArtifact, "fallback"],
				] as Array<
					[
						string | undefined,
						(path: string) => { target?: string; operatorFeedback?: string[] } | undefined,
						"fallback",
					]
				>)
			: []),
	];
	const seenPaths = new Set<string>();
	const exactRows: string[] = [];
	const exactSources: string[] = [];
	const fallbackRows: string[] = [];
	const fallbackSources: string[] = [];
	for (const [path, parse, mode] of specs) {
		if (!path || !existsSync(path)) continue;
		if (seenPaths.has(path)) continue;
		seenPaths.add(path);
		const artifact = parse(path);
		if (!artifact) continue;
		const feedback = artifact.operatorFeedback ?? [];
		if (feedback.length) {
			const exact = mode === "scoped" && artifactTargetMatches(target, artifact.target);
			if (exact) {
				exactSources.push(path);
				exactRows.push(...feedback);
			} else {
				fallbackSources.push(path);
				fallbackRows.push(...feedback);
			}
		}
	}
	const rows = exactRows.length ? exactRows : fallbackRows;
	const sourceArtifacts = exactRows.length ? exactSources : fallbackSources;
	const dedupedRows = Array.from(new Set(rows)).slice(0, 48);
	const commands = operatorFeedbackNextCommands(dedupedRows)
		.map((command: any) => operatorCommandConcrete(command, target).command)
		.filter((command: any) => /^re[-_]/i.test(command))
		.filter((command: any) => !/^re[-_]proof[-_]loop\b/i.test(command));
	return {
		rows: dedupedRows,
		commands: Array.from(new Set(commands)).slice(0, 16),
		sourceArtifacts: Array.from(new Set(sourceArtifacts)).slice(0, 16),
	};
}
