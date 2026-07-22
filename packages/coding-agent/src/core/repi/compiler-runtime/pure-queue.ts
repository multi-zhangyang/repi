import { operatorFeedbackNextCommands } from "../replayer-runtime/pure.ts";
import { readTextFile as readText } from "../storage.ts";
import { shellQuote } from "../target.ts";
import type { VerifierArtifact } from "../verifier-runtime.ts";
import { d } from "./deps.ts";

export function compilerReproCommands(verifier: any, verifierPath: string): string[] {
	const ledgerCommands = Array.from(readText(d().evidenceLedgerPath()).matchAll(/- command: `([^`]+)`/g))
		.map((match: any) => match[1]?.replace(/\\`/g, "`").trim())
		.filter((command: any): command is string => Boolean(command));
	const verifyCommands = verifier.assertions
		.flatMap((assertion: any) => assertion.evidence)
		.map((item: any) => /^verify:\s*(.+)$/i.exec(item)?.[1]?.trim())
		.filter((command: any): command is string => Boolean(command));
	return Array.from(
		new Set([
			...ledgerCommands.slice(-12),
			...verifyCommands.slice(0, 8),
			...operatorFeedbackNextCommands(verifier.operatorFeedback ?? []).slice(0, 6),
			`cat ${shellQuote(verifierPath)}`,
			...verifier.sourceArtifacts
				.slice(0, 5)
				.map((artifact: any) => `test -f ${shellQuote(artifact)} && cat ${shellQuote(artifact)}`),
		]),
	).slice(0, 24);
}
export function compilerNextOperatorQueue(verifier: VerifierArtifact): string[] {
	const needsRepair = verifier.assertions.some(
		(assertion) =>
			assertion.status === "missing" || assertion.status === "weak" || assertion.status === "contradicted",
	);
	const repair = verifier.assertions
		.filter((assertion: any) => assertion.status !== "proved")
		.flatMap((assertion: any) => assertion.requiredFollowups);
	return Array.from(
		new Set([
			...operatorFeedbackNextCommands(verifier.operatorFeedback ?? []),
			...(needsRepair ? ["re_operator escalate"] : []),
			...repair,
			...verifier.nextActions,
			needsRepair ? "re_verifier check" : "re_compiler final",
			"re_domain_proof_exit show",
			"re_complete audit",
			"re_runtime_adapter run",
		]),
	).slice(0, 18);
}
export function compilerGaps(verifier: VerifierArtifact): string[] {
	const gapAssertions = verifier.assertions
		.filter((assertion: any) => assertion.status === "missing" || assertion.status === "weak")
		.map((assertion: any) => `${assertion.id} [${assertion.status}]: ${assertion.claim}`);
	const feedbackGaps = (verifier.operatorFeedback ?? [])
		.filter((row: any) =>
			/category=(unresolved_target|dispatcher_gap|missing_tool_or_dependency|runtime_failure|failure_budget_exhausted|worker_retry_blocked|swarm_retry_queue)/i.test(
				row,
			),
		)
		.map((row: any) => `operator_feedback: ${row}`);
	const reverseGaps = verifier.assertions
		.filter((assertion: any) => /proof_exit|technique|mitre|cwe|reverse/i.test(`${assertion.id} ${assertion.claim}`))
		.filter(
			(assertion: any) =>
				assertion.status === "missing" || assertion.status === "weak" || assertion.status === "contradicted",
		)
		.map((assertion: any) => `reverse_proof_gap: ${assertion.id} [${assertion.status}] ${assertion.claim}`);
	return Array.from(
		new Set([
			...verifier.gaps,
			...gapAssertions,
			...feedbackGaps,
			...reverseGaps,
			...(reverseGaps.length ? ["re_domain_proof_exit show", "re_complete audit"] : []),
		]),
	).slice(0, 36);
}
