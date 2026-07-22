/** Compiler artifact build. */
/** Compiler build/write/output with reverse domain next. */

import { ensureReconStorage } from "../resources.ts";
import { latestOrBuildVerifier } from "../verifier-runtime/build-core-io.ts";
import { compilerOutcome } from "../verifier-runtime/pure.ts";
import { buildCompilerNextOperatorQueue } from "./build-core-queue.ts";
import { writeCompiledReport } from "./build-format-paths.ts";
import { d } from "./deps.ts";
import {
	compilerClaimCheckReady,
	compilerContradictions,
	compilerKeyEvidence,
	compilerReportLines,
	compilerReproCommands,
	compilerStatusSummary,
	latestCompilerClaimCheckInputs,
} from "./pure.ts";
import { compilerGaps } from "./pure-queue.ts";
import type { CompilerArtifact } from "./types.ts";
export function buildCompiler(options: { target?: string; mode?: "draft" | "final" } = {}): CompilerArtifact {
	ensureReconStorage();
	const { verifier, path: verifierArtifact } = latestOrBuildVerifier(options);
	const claimCheckInputs = latestCompilerClaimCheckInputs({ target: options.target });
	const summary = compilerStatusSummary(verifier.assertions);
	const mode = options.mode ?? "draft";
	const strictBlocksFinal = mode === "final" && claimCheckInputs.strictClaimCheck.status !== "pass";
	const structuredClaimBlocksFinal =
		mode === "final" && claimCheckInputs.structuredClaimMergeCheck.status === "blocked";
	const compiler: CompilerArtifact = {
		timestamp: new Date().toISOString(),
		missionId: verifier.missionId,
		route: verifier.route,
		target: options.target ?? verifier.target,
		mode,
		verifierArtifact,
		supervisorArtifact: claimCheckInputs.supervisorPath,
		operatorFeedback: verifier.operatorFeedback ?? [],
		statusSummary: summary,
		outcome: [
			...compilerOutcome(verifier, summary),
			...(strictBlocksFinal
				? [
						`status=blocked_by_claim_check strict_claim_check=${claimCheckInputs.strictClaimCheck.status}`,
						"claim boundary: final reports require a passing strict claim release marker from check:claim-release.",
					]
				: []),
			...(structuredClaimBlocksFinal
				? [
						`status=blocked_by_structured_claim_merge structured_claim_merge=${claimCheckInputs.structuredClaimMergeCheck.status}`,
						"claim boundary: final reports require StructuredClaimMergeV1 final promotion to pass artifact/jsonQuery/verifier/challenge/conflict checkpoints.",
					]
				: []),
		],
		keyEvidence: compilerKeyEvidence(verifier),
		reproCommands: compilerReproCommands(verifier, verifierArtifact),
		contradictions: compilerContradictions(verifier),
		gaps: [
			...compilerGaps(verifier),
			...(claimCheckInputs.strictClaimCheck.status !== "pass"
				? [
						`strict claim checkpoint ${claimCheckInputs.strictClaimCheck.status}: ${claimCheckInputs.strictClaimCheck.markerPath ?? "missing marker"}`,
						...claimCheckInputs.strictClaimCheck.requiredGaps.map(
							(gap: any) => `strict claim required gap: ${gap}`,
						),
					]
				: []),
			...(claimCheckInputs.structuredClaimMergeCheck.status === "blocked"
				? [
						`structured claim merge blocked: ${claimCheckInputs.structuredClaimMergeCheck.mergePath ?? "missing merge path"}`,
						...claimCheckInputs.structuredClaimMergeCheck.errors.map(
							(error: any) => `structured claim merge error: ${error}`,
						),
					]
				: []),
		],
		nextOperatorQueue: buildCompilerNextOperatorQueue({ claimCheckInputs, verifier }),
		finalReport: [],
		releaseCheckMetadata: claimCheckInputs.releaseCheckMetadata,
		claimCheckPolicy: claimCheckInputs.claimCheckPolicy,
		strictClaimCheck: claimCheckInputs.strictClaimCheck,
		claimCheckResult: claimCheckInputs.claimCheckResult,
		structuredClaimMergeCheck: claimCheckInputs.structuredClaimMergeCheck,
		sourceArtifacts: Array.from(
			new Set(
				[
					verifierArtifact,
					claimCheckInputs.supervisorPath,
					claimCheckInputs.swarmPath,
					claimCheckInputs.strictClaimCheck.markerPath,
					claimCheckInputs.structuredClaimMergeCheck.mergePath,
					...verifier.sourceArtifacts,
				].filter(Boolean) as string[],
			),
		).slice(0, 56),
	};
	compiler.finalReport = compilerReportLines(compiler);
	if (compiler.mode === "final") {
		if (compilerClaimCheckReady(compiler)) compiler.reportPath = writeCompiledReport(compiler);
		else
			d().updateMissionCheckpoint(
				"report_or_writeup_ready",
				"blocked",
				`strict_claim_check=${compiler.strictClaimCheck?.status ?? "missing"} marker=${compiler.strictClaimCheck?.markerPath ?? "missing"}`,
			);
	}
	return compiler;
}
