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

/** Memory product removed: these paths must not force verifier contradictions. */
function isRemovedMemoryProductPath(artifact: string): boolean {
	const lower = artifact.replace(/\\/g, "/").toLowerCase();
	return (
		/\/memory\//.test(lower) ||
		/(?:^|\/)(dispatcher-promotion-playbook|compaction-auto-resume-board|autonomous-budget-ledger|formal-playbook)\.md$/.test(
			lower,
		) ||
		/memory[-_](events|store|orchestrator|deposition|experience|skill|distill|quality|replay|strategy|active|maturation|vector|semantic|contradiction|injection)/i.test(
			lower,
		)
	);
}

export function artifactAssertions(operator: OperatorArtifact): VerifierAssertion[] {
	// Drop removed memory-product paths entirely (product memory deleted).
	const artifacts = operator.sourceArtifacts
		.filter((artifact: any) => !isRemovedMemoryProductPath(String(artifact)))
		.slice(0, 24);
	return artifacts.map((artifact: any, index: any) => {
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
