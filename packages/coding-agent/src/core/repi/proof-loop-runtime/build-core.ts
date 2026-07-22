/** Proof-loop artifact build/write helpers. */
import { join } from "node:path";
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { latestScopedMarkdownArtifact as latestScopedMarkdownArtifactConcrete } from "../artifact-scope-filter.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceProofLoopsDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import {
	appendEvidence,
	appendProofLoopMemoryEvent,
	appendRuntimeFailureRepairFromProofLoop,
	autonomousExecutionBudget,
	buildProofLoopSteps,
	proofLoopSourceArtifacts,
	readCurrentMission,
	refreshProofLoop,
	updateMissionCheckpoint,
	withScopedMarkdownArtifactSelectionCache,
} from "./deps.ts";
import { formatProofLoop } from "./format.ts";
import type { ProofLoopArtifact } from "./types.ts";

export function latestProofLoopArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifactConcrete("proof_loop", evidenceProofLoopsDir(), options);
}

export function buildProofLoop(
	options: { target?: string; mode?: "plan" | "run"; maxSteps?: number; replaySteps?: number } = {},
): ProofLoopArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const maxSteps = Math.max(1, Math.min(12, Math.floor(options.maxSteps ?? 4)));
	const replaySteps = Math.max(1, Math.min(10, Math.floor(options.replaySteps ?? 2)));
	return refreshProofLoopCached({
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route.domain,
		target: options.target ?? mission?.task,
		mode: options.mode ?? "plan",
		maxSteps,
		replaySteps,
		steps: buildProofLoopSteps(options.target ?? mission?.task),
		executed: [],
		verdict: "partial",
		checkStatus: [],
		evidenceSummary: [],
		gapClassifier: [],
		quickPath: [],
		quickPlanPhases: [],
		quickPlanAssertions: [],
		runtimeAdapterClosure: [],
		caseMemoryLanePlan: undefined,
		caseMemoryBridge: [],
		autonomousBudget: autonomousExecutionBudget(options.target ?? mission?.task),
		dispatcherScoreDecay: [],
		repeatedFailureDemotions: [],
		highScorePromotions: [],
		failureSignaturePriority: [],
		failureSignatureRepairQueue: [],
		compactResumeTelemetry: [],
		compactResumeQueue: [],
		operatorFeedback: [],
		operatorFeedbackQueue: [],
		swarmRetryQueue: [],
		specialistQueue: [],
		swarmBridge: [],
		bridgeArtifacts: [],
		nextActions: [],
		sourceArtifacts: proofLoopSourceArtifacts(options.target),
	});
}

export function refreshProofLoopCached(proof: ProofLoopArtifact): ProofLoopArtifact {
	return withScopedMarkdownArtifactSelectionCache(() => refreshProofLoop(proof));
}

export function writeProofLoopArtifact(proof: ProofLoopArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceProofLoopsDir(),
		`${proof.timestamp.replace(/[:.]/g, "-")}-${slug(proof.route ?? "proof-loop")}-${proof.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Proof Loop Artifact",
			"",
			formatProofLoop(proof, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(proof, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: proof.mode === "run" ? "runtime" : "artifact",
		title: `proof-loop-${proof.mode} ${proof.missionId ?? "no-mission"}`,
		fact: `Proof loop ${proof.mode}: verdict=${proof.verdict}, executed=${proof.executed.length}, replay_steps=${proof.replaySteps}, gaps=${proof.gapClassifier.length}, quick_path=${proof.quickPath.length}, quick_plan_phases=${proof.quickPlanPhases.length}, quick_plan_assertions=${proof.quickPlanAssertions.length}, runtime_adapter_closure=${proof.runtimeAdapterClosure.length}, compact_resume_queue=${proof.compactResumeQueue.length}, compact_resume_telemetry=${proof.compactResumeTelemetry.length}, operator_feedback=${proof.operatorFeedback.length}, operator_feedback_queue=${proof.operatorFeedbackQueue.length}, swarm_retry_queue=${proof.swarmRetryQueue.length}, specialist_queue=${proof.specialistQueue.length}, swarm_bridge=${proof.swarmBridge.length}, autonomous_budget=${proof.autonomousBudget?.maxTurns ?? "none"}/${proof.autonomousBudget?.maxProofLoops ?? "none"}, score_decay=${(proof.dispatcherScoreDecay ?? []).length}, demotions=${(proof.repeatedFailureDemotions ?? []).length}, promotions=${(proof.highScorePromotions ?? []).length}, case_memory_lane_plan=${proof.caseMemoryLanePlan?.action ?? "none"}`,
		command: `re_proof_loop ${proof.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "verifier/compiler/replayer/autofix bounded proof loop",
	});
	updateMissionCheckpoint("proof_loop_ready", proof.verdict === "blocked" ? "blocked" : "done", path);
	appendRuntimeFailureRepairFromProofLoop(proof, path);
	if (proof.mode === "run") appendProofLoopMemoryEvent(proof, path);
	return path;
}

/** reverse: run path still requires runtime capture before claim promotion */
