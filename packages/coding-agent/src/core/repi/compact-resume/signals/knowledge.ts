/** Compact-resume knowledge signals. */
import { latestReconCompactionResumeTelemetry } from "../telemetry.ts";
import { buildCompactResumeKnowledgeHints } from "./knowledge-hints.ts";
export function compactResumeKnowledgeSignals(target?: string): {
	path: string;
	lines: string[];
	caseMemory: string[];
	routingHints: string[];
	commandHints: string[];
	sourceArtifacts: string[];
	status: "missing" | "queued" | "blocked" | "partial" | "done";
} {
	const latest = latestReconCompactionResumeTelemetry();
	const telemetry = latest.telemetry;
	if (!telemetry && latest.lines.length === 0) {
		return {
			path: latest.path,
			lines: [],
			caseMemory: [],
			routingHints: [],
			commandHints: [],
			sourceArtifacts: [],
			status: "missing",
		};
	}
	const queued = telemetry?.commandStatus.filter((row: any) => row.status === "queued") ?? [];
	const blocked = telemetry?.commandStatus.filter((row: any) => row.status === "blocked") ?? [];
	const done = telemetry?.commandStatus.filter((row: any) => row.status === "done") ?? [];
	const terminalResumeDone = Boolean(
		telemetry?.contractVerified && telemetry.autoResumeTriggered && telemetry.proofLoopEntered,
	);
	const status: "queued" | "blocked" | "partial" | "done" = terminalResumeDone
		? "done"
		: blocked.length
			? "blocked"
			: queued.length
				? "queued"
				: telemetry?.contractVerified && telemetry.autoResumeTriggered && !telemetry.proofLoopEntered
					? "partial"
					: "done";
	const { commandHints, caseMemory, routingHints } = buildCompactResumeKnowledgeHints({
		target,
		status,
		queued,
		blocked,
		done,
		telemetry,
		sourcePath: latest.path,
	});
	return {
		path: latest.path,
		lines: latest.lines,
		caseMemory,
		routingHints,
		commandHints,
		sourceArtifacts: Array.from(new Set([latest.path, ...(telemetry?.sourceArtifacts ?? [])])).slice(0, 40),
		status,
	};
}
