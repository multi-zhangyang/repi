/** Runtime adapter output parse / summary / artifact format. */

import { shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import type {
	RuntimeAdapterExecutionArtifactV1,
	RuntimeAdapterExecutionRowV1,
	RuntimeAdapterParserSignalSummaryV1,
} from "./types.ts";

export function materializeRuntimeAdapterCommand(template: string, target?: string): string {
	const targetValue = target?.trim() || ".";
	// Only strip an optional first-line "adapter-id: " label — never strip shell `${var:-default}` colons.
	const body = template.replace(/^([A-Za-z0-9_.-]+-adapter)\s*:\s*/i, "");
	return body.replaceAll("<target>", shellQuote(targetValue)).replaceAll("\0", "");
}

export function parseRuntimeAdapterSignals(
	adapter: RuntimeAdapterExecutionRowV1,
	combinedOutput: string,
): RuntimeAdapterExecutionArtifactV1["parserSignals"] {
	return adapter.parserRules.map((rule: any) => {
		let matches: string[] = [];
		try {
			const regex = new RegExp(rule.regex, "gi");
			matches = Array.from(combinedOutput.matchAll(regex))
				.map((match: any) => truncateMiddle(match[0], 180))
				.slice(0, 12);
		} catch (error) {
			matches = [`parser_error=${error instanceof Error ? error.message : String(error)}`];
		}
		return { ruleId: rule.id, evidenceRank: rule.evidenceRank, proofExitSignal: rule.proofExitSignal, matches };
	});
}

export function summarizeRuntimeAdapterSignals(
	adapter: RuntimeAdapterExecutionRowV1,
	parserSignals: RuntimeAdapterExecutionArtifactV1["parserSignals"],
): RuntimeAdapterParserSignalSummaryV1 {
	const matchedSignals = parserSignals.filter((signal: any) => signal.matches.length > 0);
	const matchedProofExitSignals = Array.from(new Set(matchedSignals.map((signal: any) => signal.proofExitSignal)));
	const missingProofExitSignals = adapter.proofExitSignals.filter(
		(signal) => !matchedProofExitSignals.includes(signal),
	);
	return {
		matchedRules: matchedSignals.length,
		totalRules: adapter.parserRules.length,
		matchCount: matchedSignals.reduce((sum: any, signal: any) => sum + signal.matches.length, 0),
		evidenceRanks: Array.from(new Set(matchedSignals.map((signal: any) => signal.evidenceRank))),
		matchedProofExitSignals,
		missingProofExitSignals,
	};
}

export function formatRuntimeAdapterExecutionArtifact(
	artifact: RuntimeAdapterExecutionArtifactV1,
	path?: string,
): string {
	return [
		"runtime_adapter_run:",
		"RuntimeAdapterExecutionArtifactV1: true",
		path ? `artifact: ${path}` : undefined,
		`adapter: ${artifact.adapterId}`,
		`domain: ${artifact.domainId}`,
		`bridge: ${artifact.bridgeId}`,
		`target: ${artifact.target ?? "<none>"}`,
		`runner: ${artifact.selectedRunner}`,
		`exit: ${artifact.exitCode} killed=${artifact.killed}`,
		`stdout_sha256: ${artifact.stdoutSha256}`,
		`stderr_sha256: ${artifact.stderrSha256}`,
		`command: ${artifact.command}`,
		"parser_signals:",
		...artifact.parserSignals.map(
			(signal) =>
				`- ${signal.ruleId} rank=${signal.evidenceRank} => ${signal.proofExitSignal}: ${signal.matches.join(" | ") || "no-match"}`,
		),
		artifact.parserSignalSummary
			? `parser_signal_summary: matched=${artifact.parserSignalSummary.matchedRules}/${artifact.parserSignalSummary.totalRules} matches=${artifact.parserSignalSummary.matchCount} ranks=${artifact.parserSignalSummary.evidenceRanks.join(",") || "<none>"} missing_proof=${artifact.parserSignalSummary.missingProofExitSignals.join("; ") || "<none>"}`
			: undefined,
		`artifact_kinds: ${artifact.artifactKinds.join(", ")}`,
		`ingest_targets: ${artifact.ingestTargets.join(", ")}`,
		`proof_exit_signals: ${artifact.proofExitSignals.join("; ")}`,
	]
		.filter(Boolean)
		.join("\n");
}
