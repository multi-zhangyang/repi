/** Knowledge-graph compact-resume signals. */
import { latestReconCompactionResumeTelemetry } from "../compact-resume/telemetry.ts";
import { shellQuote } from "../target.ts";

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
	const targetRef = target?.trim() || "<target>";
	const commandHints = Array.from(
		new Set([
			...queued.map((row: any) => row.command),
			...(status !== "done" ? [`re_proof_loop run ${targetRef} 4 2`] : []),
			"re_knowledge_graph build",
			"re_complete audit",
		]),
	).slice(0, 12);
	const caseMemory = [
		[
			"compact_resume_case_memory",
			`status=${status}`,
			`contract_verified=${telemetry?.contractVerified ?? false}`,
			`auto_resume=${telemetry?.autoResumeTriggered ?? false}`,
			`proof_loop_entered=${telemetry?.proofLoopEntered ?? false}`,
			`queued=${queued.length}`,
			`blocked=${blocked.length}`,
			`done=${done.length}`,
			`context_path=${telemetry?.contextPath ?? "none"}`,
		].join(" "),
		...blocked
			.slice(0, 6)
			.map((row: any) =>
				[
					"compact_resume_repair",
					`command=${shellQuote(row.command)}`,
					row.outputSha256 ? `output_sha256=${row.outputSha256}` : undefined,
					`source=${latest.path}`,
				]
					.filter(Boolean)
					.join(" "),
			),
		...queued
			.slice(0, 6)
			.map((row: any) => `compact_resume_queue command=${shellQuote(row.command)} next=${shellQuote(row.command)}`),
		...(status === "done" && telemetry?.proofLoopEntered
			? [`compact_resume_success resume_contract_survived=true proof_loop_entered=true source=${latest.path}`]
			: []),
	].slice(0, 20);
	const routingHints = [
		...(blocked.length
			? [
					`compact_resume_routing status=blocked -> re_domain_proof_exit show; re_runtime_adapter run ${targetRef}; re_autofix plan ${targetRef}; re_proof_loop run ${targetRef} 4 2`,
				]
			: []),
		...(queued.length
			? queued.slice(0, 6).map((row: any) => `compact_resume_routing status=queued -> ${row.command}`)
			: []),
		...(telemetry?.contractVerified && telemetry.autoResumeTriggered && !telemetry.proofLoopEntered
			? [`compact_resume_routing proof_loop_missing -> re_proof_loop run ${targetRef} 4 2`]
			: []),
		...(status === "done"
			? [`compact_resume_routing status=done -> re_knowledge_graph build ${targetRef}; re_complete audit`]
			: []),
	].slice(0, 20);
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
