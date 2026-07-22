/** Assemble refreshed proof-loop artifact payload. */
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { proofLoopCheckStatus, proofLoopEvidenceSummary, proofLoopSourceArtifacts } from "./gaps.ts";
import { proofLoopNextActions } from "./steps-next-actions.ts";

export function assembleRefreshedProofLoop(params: {
	proof: ProofLoopArtifact;
	steps: any;
	verdict: any;
	gapClassifier: any;
	quickPath: any;
	quickPlan: any;
	runtimeAdapterClosure: any;
	caseMemoryLanePlan: any;
	caseMemoryBridge: any;
	autonomousBudget: any;
	failureSignature: any;
	compactResume: any;
	compactResumeQueue: any;
	operatorFeedback: any;
	operatorFeedbackQueue: any;
	swarmRetry: any;
	specialistQueue: any;
	swarmBridge: any;
	bridgeArtifacts: any;
}): ProofLoopArtifact {
	const {
		proof,
		steps,
		verdict,
		gapClassifier,
		quickPath,
		quickPlan,
		runtimeAdapterClosure,
		caseMemoryLanePlan,
		caseMemoryBridge,
		autonomousBudget,
		failureSignature,
		compactResume,
		compactResumeQueue,
		operatorFeedback,
		operatorFeedbackQueue,
		swarmRetry,
		specialistQueue,
		swarmBridge,
		bridgeArtifacts,
	} = params;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${proof.target ?? ""} ${proof.route ?? ""} ${proof.verdict ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${proof.target ?? ""} ${proof.route ?? ""} proof_loop refresh`,
				target: proof.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const base: ProofLoopArtifact = {
		...proof,
		steps,
		verdict,
		checkStatus: proofLoopCheckStatus(),
		evidenceSummary: proofLoopEvidenceSummary(proof.target),
		gapClassifier,
		quickPath,
		quickPlanPhases: quickPlan.phases,
		quickPlanAssertions: quickPlan.assertions,
		runtimeAdapterClosure,
		caseMemoryLanePlan,
		caseMemoryBridge,
		autonomousBudget,
		dispatcherScoreDecay: autonomousBudget.scoreDecay,
		repeatedFailureDemotions: autonomousBudget.demotionRules,
		highScorePromotions: autonomousBudget.promotionRules,
		failureSignaturePriority: failureSignature.rows,
		failureSignatureRepairQueue: failureSignature.repairQueue,
		compactResumeTelemetry: compactResume.lines,
		compactResumeQueue,
		operatorFeedback: operatorFeedback.rows,
		operatorFeedbackQueue,
		swarmRetryQueue: swarmRetry,
		specialistQueue,
		swarmBridge,
		bridgeArtifacts,
		nextActions: [],
		sourceArtifacts: [],
	};
	return {
		...base,
		nextActions: Array.from(new Set([...reverseNext, ...proofLoopNextActions(base)])).slice(0, 24),
		sourceArtifacts: Array.from(
			new Set(
				[
					...proofLoopSourceArtifacts(proof.target),
					autonomousBudget.dispatcherBoardPath,
					autonomousBudget.promotionPlaybookPath,
					...failureSignature.sourceArtifacts,
					compactResume.path,
					...operatorFeedback.sourceArtifacts,
					...bridgeArtifacts,
				].filter(Boolean) as string[],
			),
		).slice(0, 72),
	};
}
