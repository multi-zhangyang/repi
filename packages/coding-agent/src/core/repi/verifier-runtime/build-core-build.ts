/** Build verifier artifact with reverse proof gates. */

import { latestOrBuildOperator } from "../operator-runtime/core-write.ts";
import { classifyOperatorFeedback } from "../operator-runtime/feedback-classify.ts";
import { operatorFeedbackNextCommands } from "../replayer-runtime/pure.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { artifactAssertions, checkAssertions, executionAssertion } from "./pure.ts";
import type { VerifierArtifact } from "./types.ts";

export function buildVerifier(options: { target?: string; mode?: "check" | "matrix" } = {}): VerifierArtifact {
	ensureReconStorage();
	const { operator, path: operatorArtifact } = latestOrBuildOperator(options);
	const operatorFeedback = classifyOperatorFeedback(operator, operatorArtifact, options.target);
	const executionAssertions = operator.executed.map((execution: any, index: number) =>
		executionAssertion(execution, index, operatorArtifact),
	);
	const assertions = [...executionAssertions, ...checkAssertions(), ...artifactAssertions(operator)];
	if (executionAssertions.length === 0) {
		assertions.unshift({
			id: "exec:none",
			subject: "operator executions",
			claim: "at least one operator dispatch execution exists",
			status: "missing",
			confidence: 20,
			evidence: [`operator_artifact: ${operatorArtifact}`],
			counterEvidence: ["operator.executed is empty"],
			requiredFollowups: ["re_operator dispatch <target> 1", "re_verifier check"],
		});
	}
	const contradictions = assertions
		.filter((assertion: any) => assertion.status === "contradicted")
		.map((assertion: any) => `${assertion.id}: ${assertion.counterEvidence.join(" | ") || assertion.claim}`);
	const gaps = assertions
		.filter((assertion: any) => assertion.status === "missing" || assertion.status === "weak")
		.map((assertion: any) => `${assertion.id}: ${assertion.claim}`);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${options.target ?? ""} ${operator.route ?? ""} verifier`,
		target: options.target ?? operator.target,
		includeGates: true,
	}).slice(0, 3);
	const nextActions = Array.from(
		new Set([
			...reverseNext,
			...operatorFeedbackNextCommands(operatorFeedback),
			...(contradictions.length ? ["re_operator escalate"] : []),
			...(gaps.length ? ["re_operator dispatch <target> 1", "re_verifier check"] : []),
			"re_complete audit",
		]),
	).slice(0, 12);
	return {
		timestamp: new Date().toISOString(),
		missionId: operator.missionId,
		route: operator.route,
		target: options.target ?? operator.target,
		mode: options.mode ?? "check",
		operatorArtifact,
		operatorFeedback,
		assertions,
		contradictions,
		gaps,
		nextActions,
		sourceArtifacts: Array.from(new Set([operatorArtifact, ...operator.sourceArtifacts])).slice(0, 36),
	};
}
