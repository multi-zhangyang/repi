/** Verifier execution/artifact assertions. */

import { existsSync } from "node:fs";
import type { OperatorArtifact } from "../operator-runtime.ts";
import { shellQuote } from "../target.ts";
import { slug } from "../text.ts";
import {
	verifierConfidence,
	verifierCounterEvidence,
	verifierInterestingEvidence,
	verifierStatusFromExecution,
} from "./pure-status.ts";
import type { VerifierAssertion } from "./types.ts";

export function executionAssertion(execution: any, index: number, operatorPath: string): VerifierAssertion {
	const status = verifierStatusFromExecution(execution);
	const evidence = verifierInterestingEvidence(execution.output, `operator_execution: ${execution.command}`).slice(
		0,
		10,
	);
	const counterEvidence = verifierCounterEvidence(execution.output);
	return {
		id: `exec:${index + 1}:${slug(execution.command).slice(0, 24)}`,
		subject: execution.command,
		claim: `operator step ${execution.stepId} completed with status=${execution.status}`,
		status,
		confidence: verifierConfidence(status),
		evidence: [`operator_artifact: ${operatorPath}`, ...evidence],
		counterEvidence,
		requiredFollowups:
			status === "proved"
				? ["re_verifier matrix", "re_complete audit"]
				: [
						"re_operator escalate",
						`re_operator dispatch <target> 1 # retry ${execution.stepId}`,
						"re_verifier check",
						"re_domain_proof_exit show /* + re_runtime_adapter run */",
					],
	};
}

export function artifactAssertions(operator: OperatorArtifact): VerifierAssertion[] {
	return operator.sourceArtifacts.slice(0, 24).map((artifact: any, index: any) => {
		const present = existsSync(artifact);
		return {
			id: `artifact:${index + 1}:${slug(artifact).slice(0, 24)}`,
			subject: artifact,
			claim: "source artifact exists and can be inspected",
			status: present ? "proved" : "contradicted",
			confidence: present ? 90 : 10,
			evidence: present ? [`path: ${artifact}`, `verify: test -f ${shellQuote(artifact)}`] : [],
			counterEvidence: present ? [] : [`missing artifact: ${artifact}`],
			requiredFollowups: present
				? ["re_verifier matrix"]
				: ["re_context pack", "re_domain_proof_exit show /* + re_runtime_adapter run */"],
		};
	});
}

/** Render a falsifiable proof-contract block bound to a catalogued technique's proofExit.
 * Maps the technique's proofExit → assertion, pitfalls → counter-evidence probes,
 * tools → expected tool surface. This binds re_verifier assertions to the same
 * falsifiable done-when the specialist doctrines use, so verification cannot drift
 * from the technique's definition of "proved". Returns "" when the id is absent/unknown. */
