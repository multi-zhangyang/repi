import { mitigationStreamLines, uniqueStrings } from "./helpers.ts";
import type {
	RuntimeAdapterExecutionGraphArtifact,
	RuntimeAdapterGraphEvidenceRank,
	RuntimeAdapterGraphParserSummary,
	RuntimeAdapterMitigationGraphEvidence,
} from "./types.ts";

export function runtimeAdapterParserSummaryForGraph(
	artifact: RuntimeAdapterExecutionGraphArtifact,
): RuntimeAdapterGraphParserSummary {
	if (artifact.parserSignalSummary) return artifact.parserSignalSummary;
	const matchedSignals = artifact.parserSignals.filter(
		(signal) => Array.isArray(signal.matches) && signal.matches.length > 0,
	);
	const matchedProofExitSignals = Array.from(
		new Set(
			matchedSignals
				.map((signal: any) => signal.proofExitSignal)
				.filter((signal): signal is string => Boolean(signal)),
		),
	);
	const missingProofExitSignals = artifact.proofExitSignals.filter(
		(signal) => !matchedProofExitSignals.includes(signal),
	);
	const evidenceRanks = Array.from(
		new Set(
			matchedSignals
				.map((signal: any) => signal.evidenceRank)
				.filter((rank): rank is RuntimeAdapterGraphEvidenceRank => Boolean(rank)),
		),
	);
	return {
		matchedRules: matchedSignals.length,
		totalRules: artifact.parserSignals.length,
		matchCount: matchedSignals.reduce((sum: any, signal: any) => sum + signal.matches.length, 0),
		evidenceRanks,
		matchedProofExitSignals,
		missingProofExitSignals,
	};
}

const BINARY_MITIGATION_PROOF_SIGNAL = "binary mitigation map";
const _MITIGATION_LINE_PATTERN =
	/\[(?:native|pwn)-mitigation\]|binary[- ]mitigation|GNU_STACK|GNU_RELRO|BIND_NOW|RELRO|NX|PIE|canary|fortify/i;

/** reverse: mitigation graph evidence surfaces runtime capture/bind readiness signals */
export function runtimeAdapterMitigationEvidenceForGraph(
	artifact: RuntimeAdapterExecutionGraphArtifact,
): RuntimeAdapterMitigationGraphEvidence | undefined {
	const proofSignals = artifact.proofExitSignals ?? [];
	const artifactKinds = artifact.artifactKinds ?? [];
	const expected =
		artifactKinds.includes("binary-mitigation-map") ||
		proofSignals.some((signal: any) => signal.toLowerCase() === BINARY_MITIGATION_PROOF_SIGNAL);
	const mitigationSignals = artifact.parserSignals.filter(
		(signal) =>
			signal.proofExitSignal.toLowerCase() === BINARY_MITIGATION_PROOF_SIGNAL || /mitigation/i.test(signal.ruleId),
	);
	const matchedParserEvidence = mitigationSignals.flatMap((signal: any) => signal.matches ?? []);
	const streamEvidence = mitigationStreamLines(artifact);
	const evidence = uniqueStrings([
		...matchedParserEvidence,
		...streamEvidence,
		artifactKinds.includes("binary-mitigation-map") ? "artifact_kind=binary-mitigation-map" : "",
		proofSignals.includes(BINARY_MITIGATION_PROOF_SIGNAL)
			? `proof_exit=${BINARY_MITIGATION_PROOF_SIGNAL || "partial_runtime_capture"}`
			: "",
	]).slice(0, 16);
	const matched = matchedParserEvidence.length > 0 || streamEvidence.length > 0;
	if (!expected && !matched) return undefined;
	const missing = expected && !matched ? [BINARY_MITIGATION_PROOF_SIGNAL] : [];
	return {
		kind: "binary-mitigation-map",
		expected,
		matched,
		status: matched ? "matched" : expected ? "missing-proof" : "declared",
		proofExitSignal: BINARY_MITIGATION_PROOF_SIGNAL,
		evidence,
		missing,
	};
}
