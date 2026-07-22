/** Collect verifier/compiler/replay/autofix proof-loop gap items. */

import { latestAutofixArtifactPath } from "../../autofix.ts";
import { truncateMiddle } from "../../text.ts";
import {
	artifactTargetMatches,
	latestCompilerArtifactPath,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
	parseAutofixArtifact,
	parseCompilerArtifact,
	parseReplayArtifact,
	parseVerifierArtifact,
} from "../deps.ts";
import type { createProofLoopGapCollector } from "./items-core-collect-helpers.ts";

type Collector = ReturnType<typeof createProofLoopGapCollector>;

export function collectProofLoopArtifactGaps(collector: Collector): void {
	const { targetRef, add, scope } = collector;
	const verifierPath = latestVerifierArtifactPath(scope);
	const verifier = verifierPath ? parseVerifierArtifact(verifierPath) : undefined;
	if (verifierPath && verifier && artifactTargetMatches(targetRef, verifier.target)) {
		const sourceArtifacts = [verifierPath, ...verifier.sourceArtifacts];
		for (const gap of verifier.gaps.slice(0, 8)) add("verifier", `gap: ${gap}`, sourceArtifacts);
		for (const contradiction of verifier.contradictions.slice(0, 8))
			add("verifier", `contradiction: ${contradiction}`, sourceArtifacts);
		for (const assertion of verifier.assertions.filter((item: any) => item.status !== "proved").slice(0, 8)) {
			add(
				"verifier",
				`${assertion.status}: ${assertion.id} ${assertion.claim}; followups=${assertion.requiredFollowups.join(" | ") || "none"}`,
				sourceArtifacts,
			);
		}
	} else {
		add("artifact", "verifier artifact missing: run re_verifier matrix before final claim", []);
	}
	const compilerPath = latestCompilerArtifactPath(scope);
	const compiler = compilerPath ? parseCompilerArtifact(compilerPath) : undefined;
	if (compilerPath && compiler && artifactTargetMatches(targetRef, compiler.target)) {
		const sourceArtifacts = [compilerPath, ...compiler.sourceArtifacts];
		for (const gap of compiler.gaps.slice(0, 10)) add("compiler", `gap: ${gap}`, sourceArtifacts);
		for (const contradiction of compiler.contradictions.slice(0, 10))
			add("compiler", `contradiction: ${contradiction}`, sourceArtifacts);
		if (compiler.statusSummary.weak > 0 || compiler.statusSummary.missing > 0) {
			add(
				"compiler",
				`summary: weak=${compiler.statusSummary.weak} missing=${compiler.statusSummary.missing} next=${compiler.nextOperatorQueue.slice(0, 6).join(" | ")}`,
				sourceArtifacts,
			);
		}
	} else {
		add("artifact", "compiler artifact missing: run re_compiler draft before proof-loop completion", []);
	}
	const replayPath = latestReplayerArtifactPath(scope);
	const replay = replayPath ? parseReplayArtifact(replayPath) : undefined;
	if (replayPath && replay && artifactTargetMatches(targetRef, replay.target)) {
		const sourceArtifacts = [replayPath, ...replay.sourceArtifacts];
		for (const blocked of replay.blocked.slice(0, 10)) add("replayer", `blocked: ${blocked}`, sourceArtifacts);
		for (const execution of replay.executions.filter((item: any) => item.status === "failed").slice(0, 10)) {
			add(
				"replayer",
				`failed: ${execution.stepId} exit=${execution.exit} command=${execution.command} stderr=${truncateMiddle(execution.stderrHead, 220)}`,
				sourceArtifacts,
			);
		}
		if (replay.executions.length === 0)
			add("replayer", "no replay execution yet: run bounded replay", sourceArtifacts);
	} else {
		add("artifact", "replayer artifact missing: run re_replayer run <target> 1", []);
	}
	const autofixPath = latestAutofixArtifactPath(scope);
	const autofix = autofixPath ? parseAutofixArtifact(autofixPath) : undefined;
	if (autofixPath && autofix && artifactTargetMatches(targetRef, autofix.target)) {
		const sourceArtifacts = [autofixPath, ...autofix.sourceArtifacts];
		for (const failure of autofix.failures.slice(0, 8)) add("autofix", `failure: ${failure}`, sourceArtifacts);
		for (const item of [
			...autofix.patchQueue,
			...autofix.commandSubstitutions,
			...autofix.bootstrapQueue,
			...autofix.evidenceRecaptureQueue,
		]
			.filter((entry: any) => entry.status !== "applied")
			.slice(0, 12)) {
			add("autofix", `${item.kind}: ${item.reason}; command=${item.command}`, [
				autofixPath,
				...item.sourceArtifacts,
			]);
		}
	}
}
