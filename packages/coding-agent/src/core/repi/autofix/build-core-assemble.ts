/** Autofix assemble next queues + artifact (includes reverse seed). */
import { seedAutofixReverseNextQueue } from "./build-core-reverse.ts";
import { appendJournal, updateMissionCheckpoint } from "./deps.ts";
import type { AutofixArtifact, AutofixItem } from "./types.ts";

export function assembleAutofixArtifact(input: {
	options: { target?: string; mode?: "plan" | "apply" };
	replay: any;
	compiler: any;
	compilerPath?: string;
	replayArtifact: string;
	operatorFeedback: string[];
	failures: any[];
	patchQueue: AutofixItem[];
	commandSubstitutions: AutofixItem[];
	bootstrapQueue: AutofixItem[];
	evidenceRecaptureQueue: AutofixItem[];
	nextOperatorQueue: string[];
	sourceArtifacts: string[];
}): AutofixArtifact {
	const {
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
	} = input;

	if (failures.length === 0 && patchQueue.length === 0) {
		seedAutofixReverseNextQueue({
			nextOperatorQueue,
			target: options.target,
			replay,
			failures,
			patchQueue,
		});
	} else {
		nextOperatorQueue.push(
			...patchQueue.map((item: any) => item.command),
			...commandSubstitutions.map((item: any) => item.command),
			...bootstrapQueue.map((item: any) => item.command),
			...evidenceRecaptureQueue.map((item: any) => item.command),
			...(compiler?.nextOperatorQueue ?? []),
			"re_replayer run",
			"re_complete audit",
		);
	}

	const applied =
		options.mode === "apply" ? Array.from(new Set([...nextOperatorQueue, ...replay.nextActions])).slice(0, 24) : [];
	if (options.mode === "apply" && applied.length > 0) {
		appendJournal(
			"autofix",
			`autofix queue ${replay.missionId ?? "no-mission"}`,
			[`replay_artifact: ${replayArtifact}`, `compiler_artifact: ${compilerPath ?? "none"}`, ...applied].join("\n"),
		);
		updateMissionCheckpoint("memory_or_evolution_written", "done", "autofix queue");
	}

	return {
		timestamp: new Date().toISOString(),
		missionId: replay.missionId ?? compiler?.missionId,
		route: replay.route ?? compiler?.route,
		target: options.target ?? replay.target ?? compiler?.target,
		mode: options.mode ?? "plan",
		replayArtifact,
		compilerArtifact: compilerPath,
		operatorFeedback,
		failures,
		patchQueue,
		commandSubstitutions,
		bootstrapQueue,
		evidenceRecaptureQueue,
		nextOperatorQueue: Array.from(new Set(nextOperatorQueue)).slice(0, 36),
		applied,
		repairRollbackPolicyStatus: "missing",
		repairRollbackPolicyErrors: [],
		sourceArtifacts,
	};
}
