/** Proof-loop verdict + evidence summary. */

import { latestAutofixArtifactPath } from "../../autofix.ts";
import type { ProofLoopVerdict } from "../../proof-loop-runtime/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import {
	artifactTargetMatches,
	latestAttackGraphArtifactPath,
	latestCompilerArtifactPath,
	latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
	parseAttackGraphArtifact,
	parseAutofixArtifact,
	parseCompilerArtifact,
	parseReplayArtifact,
	parseVerifierArtifact,
} from "../deps.ts";

export function proofLoopVerdict(target?: string): ProofLoopVerdict {
	const scope = target ? { target, requestedBy: "proof_loop_verdict_latest_artifact_consumer" } : {};
	const replayPath = latestReplayerArtifactPath(scope);
	const candidateReplay = replayPath ? parseReplayArtifact(replayPath) : undefined;
	const replay = artifactTargetMatches(target, candidateReplay?.target) ? candidateReplay : undefined;
	const compilerPath = latestCompilerArtifactPath(scope);
	const candidateCompiler = compilerPath ? parseCompilerArtifact(compilerPath) : undefined;
	const compiler = artifactTargetMatches(target, candidateCompiler?.target) ? candidateCompiler : undefined;
	const compactResume = latestReconCompactionResumeTelemetry().telemetry;
	const feedbackRows = latestOperatorFeedback(target).rows.filter(
		(row: any) => !/category=(strong_evidence|worker_retry_progress)/i.test(row),
	);
	const graphPath = latestAttackGraphArtifactPath(scope);
	const graph = graphPath ? parseAttackGraphArtifact(graphPath) : undefined;
	if (compactResume?.commandStatus.some((row: any) => row.status === "blocked")) return "needs_repair";
	if (
		compactResume?.contractVerified &&
		compactResume.autoResumeTriggered &&
		compactResume.commandStatus.some((row: any) => row.status === "queued")
	)
		return "partial";
	if (compactResume?.contractVerified && compactResume.autoResumeTriggered && !compactResume.proofLoopEntered)
		return "partial";
	if (replay?.failed || replay?.blocked.length) return "needs_repair";
	if (compiler && (compiler.statusSummary.contradicted > 0 || compiler.contradictions.length > 0))
		return "needs_repair";
	if (
		feedbackRows.some((row: any) =>
			/category=(unresolved_target|dispatcher_gap|missing_tool_or_dependency|worker_retry_blocked|runtime_failure|failure_budget_exhausted)/i.test(
				row,
			),
		)
	)
		return "needs_repair";
	if (
		graph?.gaps.some((gap: any) =>
			/runtime adapter missing (?:mitigation map )?proof|runtime adapter parser no-match|missing-proof-exit/i.test(
				gap,
			),
		)
	)
		return "needs_repair";
	if (feedbackRows.length) return "partial";
	if (!compiler || !replay) return "partial";
	if (compiler.statusSummary.missing > 0 || compiler.statusSummary.weak > 0 || compiler.gaps.length > 0)
		return "partial";
	if (replay.executions.length === 0) return "partial";
	return replay.passed > 0 ? "ready" : "blocked";
}

export function proofLoopEvidenceSummary(target?: string): string[] {
	const scope = target ? { target, requestedBy: "proof_loop_evidence_latest_artifact_consumer" } : {};
	const verifierPath = latestVerifierArtifactPath(scope);
	const candidateVerifier = verifierPath ? parseVerifierArtifact(verifierPath) : undefined;
	const verifier = artifactTargetMatches(target, candidateVerifier?.target) ? candidateVerifier : undefined;
	const compilerPath = latestCompilerArtifactPath(scope);
	const candidateCompiler = compilerPath ? parseCompilerArtifact(compilerPath) : undefined;
	const compiler = artifactTargetMatches(target, candidateCompiler?.target) ? candidateCompiler : undefined;
	const replayPath = latestReplayerArtifactPath(scope);
	const candidateReplay = replayPath ? parseReplayArtifact(replayPath) : undefined;
	const replay = artifactTargetMatches(target, candidateReplay?.target) ? candidateReplay : undefined;
	const autofixPath = latestAutofixArtifactPath(scope);
	const candidateAutofix = autofixPath ? parseAutofixArtifact(autofixPath) : undefined;
	const autofix = artifactTargetMatches(target, candidateAutofix?.target) ? candidateAutofix : undefined;
	const graphPath = latestAttackGraphArtifactPath(scope);
	const graph = graphPath ? parseAttackGraphArtifact(graphPath) : undefined;
	const feedback = latestOperatorFeedback(target);
	const compactResume = latestReconCompactionResumeTelemetry();
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${target ?? ""} ${graph?.gaps?.join(" ") ?? ""} ${feedback.rows.join(" ")}`,
		);
	const reverseNote = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${target ?? ""} proof_loop_evidence`,
				target,
				includeGates: true,
			}).slice(0, 2)
		: [];
	return [
		`verifier: ${verifierPath ?? "missing"} assertions=${verifier?.assertions.length ?? 0} contradictions=${verifier?.contradictions.length ?? 0} gaps=${verifier?.gaps.length ?? 0}`,
		`compiler: ${compilerPath ?? "missing"} proved=${compiler?.statusSummary.proved ?? 0} weak=${compiler?.statusSummary.weak ?? 0} contradicted=${compiler?.statusSummary.contradicted ?? 0} missing=${compiler?.statusSummary.missing ?? 0}`,
		`replayer: ${replayPath ?? "missing"} executed=${replay?.executions.length ?? 0} passed=${replay?.passed ?? 0} failed=${replay?.failed ?? 0} blocked=${replay?.blocked.length ?? 0}`,
		`autofix: ${autofixPath ?? "missing"} failures=${autofix?.failures.length ?? 0} applied=${autofix?.applied.length ?? 0}`,
		`attack_graph: ${graphPath ?? "missing"} gaps=${graph?.gaps.length ?? 0} task_tree=${graph?.taskTree.length ?? 0} runtime_adapter_gaps=${graph?.gaps.filter((gap: any) => /runtime adapter|missing proof|parser no-match/i.test(gap)).length ?? 0}`,
		`operator_feedback: rows=${feedback.rows.length} commands=${feedback.commands.length} sources=${feedback.sourceArtifacts.length}`,
		`compact_resume: ${compactResume.path} rows=${compactResume.lines.length} queued=${compactResume.telemetry?.commandStatus.filter((row: any) => row.status === "queued").length ?? 0} blocked=${compactResume.telemetry?.commandStatus.filter((row: any) => row.status === "blocked").length ?? 0} proof_loop_entered=${compactResume.telemetry?.proofLoopEntered ?? false}`,
		...(reverseNote.length ? reverseNote.map((cmd: any) => `reverse_next: ${cmd}`) : []),
	];
}
