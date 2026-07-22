/** Mitigation + parser summary nodes for runtime adapter proof section. */
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendRuntimeAdapterMitigationAndParser(params: {
	ctx: AttackGraphBuildCtx;
	path: string;
	artifact: any;
	artifactId: string;
	parserSummaryId: string;
	parserSummary: any;
	mitigationId: string;
	mitigationEvidence: any;
}): void {
	const { ctx, path, artifact, artifactId, parserSummaryId, parserSummary, mitigationId, mitigationEvidence } = params;
	if (mitigationEvidence) {
		ctx.addNode({
			id: mitigationId,
			kind: "artifact",
			label: `binary mitigation map ${artifact.adapterId}`,
			status: mitigationEvidence.status,
			path,
			note: mitigationEvidence.evidence.slice(0, 6).join(" | ") || "binary mitigation proof missing",
		});
		ctx.addTask({
			id: mitigationId,
			parentId: artifactId,
			kind: "artifact",
			label: `binary mitigation map ${artifact.adapterId}`,
			status: mitigationEvidence.status,
			evidence: [
				`kind=${mitigationEvidence.kind}`,
				`matched=${mitigationEvidence.matched}`,
				...mitigationEvidence.evidence.slice(0, 10),
				...mitigationEvidence.missing.map((missing: string) => `missing_proof=${missing}`),
			],
		});
		ctx.addEdge({ from: artifactId, to: mitigationId, kind: "produces", label: "binary-mitigation-map" });
		ctx.addEdge({
			from: mitigationId,
			to: parserSummaryId,
			kind: mitigationEvidence.matched ? "supports" : "blocks",
			label: mitigationEvidence.proofExitSignal,
		});
		if (!mitigationEvidence.matched && mitigationEvidence.expected) {
			ctx.gaps.push(`runtime adapter missing mitigation map proof: ${artifact.adapterId}`);
		}
	}
	ctx.addNode({
		id: parserSummaryId,
		kind: "parser_summary",
		label: `parser_signal_summary ${artifact.adapterId}`,
		status: `matched=${parserSummary.matchedRules}/${parserSummary.totalRules} missing=${parserSummary.missingProofExitSignals.length}`,
		note: `ranks=${parserSummary.evidenceRanks.join(",") || "<none>"} matched_proof=${parserSummary.matchedProofExitSignals.join(" | ") || "<none>"}`,
	});
	ctx.addTask({
		id: parserSummaryId,
		parentId: artifactId,
		kind: "parser_summary",
		label: `parser_signal_summary ${artifact.adapterId}`,
		status: `matched=${parserSummary.matchedRules}/${parserSummary.totalRules} missing=${parserSummary.missingProofExitSignals.length}`,
		evidence: [
			`matched=${parserSummary.matchedRules}/${parserSummary.totalRules}`,
			`match_count=${parserSummary.matchCount}`,
			`ranks=${parserSummary.evidenceRanks.join(",") || "<none>"}`,
			`matched_proof=${parserSummary.matchedProofExitSignals.join(" | ") || "<none>"}`,
			`missing_proof=${parserSummary.missingProofExitSignals.join(" | ") || "<none>"}`,
		],
	});
	ctx.addEdge({ from: parserSummaryId, to: artifactId, kind: "verifies", label: "parser-signal-summary" });
}

export function appendRuntimeAdapterParserSignals(params: {
	ctx: AttackGraphBuildCtx;
	artifact: any;
	artifactId: string;
	artifactBase: string;
	parserSummaryId: string;
}): void {
	const { ctx, artifact, artifactId, artifactBase, parserSummaryId } = params;
	for (const [index, signal] of artifact.parserSignals.entries()) {
		const signalId = `verify:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}:${index + 1}:${ctx.slug(signal.ruleId)}`;
		const evidenceRank = signal.evidenceRank ?? "unranked";
		ctx.addNode({
			id: signalId,
			kind: "verification",
			label: `${signal.ruleId} => ${signal.proofExitSignal}`,
			status: signal.matches.length
				? `rank=${evidenceRank} matches=${signal.matches.length}`
				: `rank=${evidenceRank} no-match`,
			note: signal.matches.slice(0, 4).join(" | ") || "parser signal did not match runner output",
		});
		ctx.addTask({
			id: signalId,
			parentId: artifactId,
			kind: "verification",
			label: `${signal.ruleId} => ${signal.proofExitSignal}`,
			status: signal.matches.length
				? `rank=${evidenceRank} matches=${signal.matches.length}`
				: `rank=${evidenceRank} no-match`,
			evidence: [`rank=${evidenceRank}`, ...signal.matches.slice(0, 6)],
		});
		ctx.addEdge({ from: signalId, to: artifactId, kind: "verifies", label: `parser:${evidenceRank}` });
		ctx.addEdge({
			from: signalId,
			to: parserSummaryId,
			kind: signal.matches.length ? "supports" : "blocks",
			label: signal.matches.length ? "matched-rule" : "no-match",
		});
	}
}
