/** Proof-loop memory event append with reverse next commands. */

import type { MemoryEventV1 } from "../memory-stubs.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { uniqueNonEmpty } from "../text.ts";
import { appendMemoryEvent } from "./deps.ts";
import { proofLoopMemoryOutcome } from "./memory-outcome.ts";

export function appendProofLoopMemoryEvent(proof: ProofLoopArtifact, artifactPath: string): MemoryEventV1 {
	const outcome = proofLoopMemoryOutcome(proof);
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${proof.target ?? ""} ${proof.route ?? ""} ${proof.nextActions?.join(" ") ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${proof.target ?? ""} ${proof.route ?? ""} proof_loop`,
				target: proof.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return appendMemoryEvent({
		source: "proof_loop",
		task: `proof_loop ${proof.mode} ${proof.target ?? proof.route ?? "security"}`,
		route: proof.route,
		target: proof.target,
		domainTags: ["proof_loop", "verifier", "compiler", "replayer", "autofix", ...(proof.route ? [proof.route] : [])],
		outcome,
		lessons: uniqueNonEmpty(
			[
				`Proof loop ${proof.mode}: verdict=${proof.verdict} executed=${proof.executed.length} replay_steps=${proof.replaySteps} specialist_queue=${proof.specialistQueue.length}.`,
				...proof.evidenceSummary,
				...proof.checkStatus,
			],
			36,
		),
		failurePatterns: uniqueNonEmpty(
			[
				...proof.steps
					.filter((step: any) => step.status === "blocked")
					.map((step: any) => `${step.id}: ${step.reason ?? "blocked"} :: ${step.command}`),
				...proof.operatorFeedbackQueue,
				...proof.swarmRetryQueue,
			],
			36,
		),
		reuseRules: uniqueNonEmpty(
			[
				outcome === "success"
					? "Proof loop reached ready; reuse verifier→compiler→replayer→knowledge→completion ordering."
					: "Partial/repair proof loops should bridge delegate→swarm→supervisor before final claim.",
				...proof.caseMemoryBridge,
				...proof.swarmBridge,
				...proof.nextActions,
			],
			48,
		),
		commands: uniqueNonEmpty(
			[
				...reverseNext,
				...proof.steps.map((step: any) => step.command),
				...proof.executed.map((execution: any) => execution.command),
				...proof.nextActions,
			],
			64,
		),
		artifactPaths: uniqueNonEmpty([artifactPath, ...proof.sourceArtifacts, ...proof.bridgeArtifacts], 120),
		confidence: proof.mode === "run" ? (outcome === "success" ? 0.9 : 0.76) : 0.62,
		replayVerified:
			proof.verdict === "ready" ||
			proof.executed.some((execution: any) => /re_replayer|replay_matrix/i.test(execution.output)),
		playbookCandidate: outcome === "success" || outcome === "repair",
		workerRoutingHint: proof.specialistQueue[0] ?? proof.swarmBridge[0],
		verifierRuleCandidate: true,
	});
}
