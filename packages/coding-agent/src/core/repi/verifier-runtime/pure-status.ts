/** Verifier status/evidence/confidence pure helpers. */
import type { VerifierStatus } from "../runtime-types.ts";
import { truncateMiddle } from "../text.ts";

export function verifierStatusFromExecution(execution: any): VerifierStatus {
	const counter = verifierCounterEvidence(execution.output);
	if (execution.status === "blocked") return counter.length ? "contradicted" : "missing";
	if (counter.some((line: any) => /unsupported|unresolved|error|failed|cannot|not found/i.test(line)))
		return "contradicted";
	if (
		/evidence_|artifact|path:|verify:|hash:|offset:|mission_id|operator_queue|reflection_cycle|context_pack|supervisor_review/i.test(
			execution.output,
		)
	)
		return "proved";
	return "weak";
}

export function verifierInterestingEvidence(output: string, fallback: string): string[] {
	const lines = output
		.split(/\r?\n/)
		.map((line: any) => line.trim())
		.filter(Boolean)
		.filter((line: any) =>
			/artifact|path:|verify:|hash:|offset:|mission_id|evidence_|ledger|status:|checkpoint|proof|anchor|exit=|code=|operator_queue|reflection_cycle|context_pack|supervisor_review/i.test(
				line,
			),
		)
		.slice(0, 12);
	return lines.length ? lines.map((line: any) => truncateMiddle(line, 260)) : [fallback];
}

export function verifierCounterEvidence(text: string): string[] {
	return text
		.split(/\r?\n/)
		.map((line: any) => line.trim())
		.filter((line: any) =>
			/blocked|pending checkpoint|missing|unsupported|unresolved|error|failed|cannot|not found|weak|contradict/i.test(
				line,
			),
		)
		.slice(0, 12)
		.map((line: any) => truncateMiddle(line, 260));
}

export function verifierConfidence(status: VerifierStatus): number {
	switch (status) {
		case "proved":
			return 85;
		case "weak":
			return 55;
		case "missing":
			return 25;
		case "contradicted":
			return 10;
	}
}
