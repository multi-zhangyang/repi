/** Autofix planner core. */
import { ensureReconStorage } from "../resources.ts";
import { assembleAutofixArtifact } from "./build-core-assemble.ts";
import { collectAutofixQueues } from "./build-core-collect.ts";
import { latestCompilerArtifactPath, parseCompilerArtifact } from "./deps.ts";
import { autofixItem, latestOrBuildReplay, replayFailureRows } from "./helpers.ts";
import type { AutofixArtifact, AutofixItem, AutofixItemKind } from "./types.ts";

export function buildAutofix(options: { target?: string; mode?: "plan" | "apply" } = {}): AutofixArtifact {
	ensureReconStorage();
	const { replay, path: replayArtifact } = latestOrBuildReplay(options);
	const compilerPath = replay.compilerArtifact ?? latestCompilerArtifactPath();
	const compiler = compilerPath ? parseCompilerArtifact(compilerPath) : undefined;
	const sourceArtifacts = Array.from(new Set([replayArtifact, compilerPath, ...replay.sourceArtifacts])).filter(
		(path): path is string => Boolean(path),
	);
	const failures = replayFailureRows(replay);
	const operatorFeedback = replay.operatorFeedback ?? compiler?.operatorFeedback ?? [];
	const patchQueue: AutofixItem[] = [];
	const commandSubstitutions: AutofixItem[] = [];
	const bootstrapQueue: AutofixItem[] = [];
	const evidenceRecaptureQueue: AutofixItem[] = [];
	const nextOperatorQueue: string[] = [];
	let index = 0;
	const add = (collection: AutofixItem[], kind: AutofixItemKind, source: string, reason: string, command: string) => {
		collection.push(autofixItem(kind, source, reason, command, sourceArtifacts, index++));
	};

	collectAutofixQueues({
		options,
		replay,
		compiler,
		operatorFeedback,
		patchQueue,
		commandSubstitutions,
		bootstrapQueue,
		evidenceRecaptureQueue,
		nextOperatorQueue,
		add,
	});

	return assembleAutofixArtifact({
		options,
		replay,
		compiler,
		compilerPath,
		replayArtifact,
		operatorFeedback,
		failures,
		patchQueue,
		commandSubstitutions,
		bootstrapQueue,
		evidenceRecaptureQueue,
		nextOperatorQueue,
		sourceArtifacts,
	});
}
