/** Evidence ledger hypothesis/counter-evidence nodes. */

import { evidenceRecordHasCounterSignal, evidenceRecordHasHypothesisSignal } from "../evidence.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { reverseEvidenceRecordNote } from "./evidence-ledger-reverse.ts";

export function appendEvidenceLedgerRecordHypothesis(
	ctx: AttackGraphBuildCtx,
	record: any,
	args: { commandOutputId?: string; openEvidenceHypotheses: string[] },
): void {
	const { commandOutputId, openEvidenceHypotheses } = args;
	const shouldAddHypothesis =
		record.fact &&
		(evidenceRecordHasHypothesisSignal(record) ||
			evidenceRecordHasCounterSignal(record) ||
			record.command ||
			record.path);
	const priorHypotheses = openEvidenceHypotheses.slice(-4);
	if (shouldAddHypothesis) {
		const hypothesisId = `hypothesis:${record.index}:${ctx.slug(record.title)}`;
		ctx.addNode({
			id: hypothesisId,
			kind: "hypothesis",
			label: ctx.truncateMiddle(record.fact ?? record.title, 160),
			status: record.confidence ?? "claim",
			note: reverseEvidenceRecordNote(record.title, `${record.kind ?? ""} ${record.fact ?? ""}`),
		});
		ctx.addTask({
			id: hypothesisId,
			parentId: record.evidenceId,
			kind: "hypothesis",
			label: ctx.truncateMiddle(record.fact ?? record.title, 180),
			status: record.confidence ?? "claim",
			evidence: [record.title],
		});
		ctx.addEdge({ from: record.evidenceId, to: hypothesisId, kind: "supports", label: `P${record.priority}` });
		if (commandOutputId)
			ctx.addEdge({ from: commandOutputId, to: hypothesisId, kind: "supports", label: "command-output-hypothesis" });
		if (record.verify) {
			const verifyId = `verify:${record.index}:${ctx.slug(record.verify)}`;
			ctx.addNode({
				id: verifyId,
				kind: "verification",
				label: ctx.truncateMiddle(record.verify, 160),
				status: "required",
				note: reverseEvidenceRecordNote(
					record.title,
					`${record.kind ?? ""} ${record.fact ?? ""} ${record.command ?? ""} ${record.path ?? ""}`,
				),
			});
			ctx.addTask({
				id: verifyId,
				parentId: hypothesisId,
				kind: "verification",
				label: ctx.truncateMiddle(record.verify, 180),
				status: "required",
				command: record.verify,
			});
			ctx.addEdge({ from: verifyId, to: hypothesisId, kind: "verifies", label: "verify command" });
		}
		openEvidenceHypotheses.push(hypothesisId);
	}
	if (evidenceRecordHasCounterSignal(record)) {
		const counterId = `counter:${record.index}:${ctx.slug(record.title)}`;
		ctx.addNode({
			id: counterId,
			kind: "counter_evidence",
			label: ctx.truncateMiddle(record.fact ?? record.title, 160),
			status: "present",
			note: record.confidence,
		});
		ctx.addTask({
			id: counterId,
			parentId: record.evidenceId,
			kind: "counter_evidence",
			label: ctx.truncateMiddle(record.fact ?? record.title, 180),
			status: "present",
			evidence: [record.title, record.verify].filter((item): item is string => Boolean(item)),
		});
		const hypothesisId = `hypothesis:${record.index}:${ctx.slug(record.title)}`;
		ctx.addEdge({ from: counterId, to: hypothesisId, kind: "refutes", label: "counter-evidence" });
		for (const priorHypothesisId of priorHypotheses) {
			ctx.addEdge({
				from: counterId,
				to: priorHypothesisId,
				kind: "refutes",
				label: "counter-evidence-prior-hypothesis",
			});
		}
	}
}
