/** Compact-resume knowledge caseMemory/routing/command hint builders. */
import { shellQuote } from "../../target.ts";

export function buildCompactResumeKnowledgeHints(input: {
	target?: string;
	status: "missing" | "queued" | "blocked" | "partial" | "done";
	queued: Array<{ command: string; outputSha256?: string }>;
	blocked: Array<{ command: string; outputSha256?: string }>;
	done: Array<{ command: string }>;
	telemetry: any;
	sourcePath: string;
}): {
	targetRef: string;
	commandHints: string[];
	caseMemory: string[];
	routingHints: string[];
} {
	const targetRef = input.target?.trim() || "<target>";
	const { status, queued, blocked, done, telemetry, sourcePath } = input;
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
					`source=${sourcePath}`,
				]
					.filter(Boolean)
					.join(" "),
			),
		...queued
			.slice(0, 6)
			.map((row: any) => `compact_resume_queue command=${shellQuote(row.command)} next=${shellQuote(row.command)}`),
		...(status === "done" && telemetry?.proofLoopEntered
			? [`compact_resume_success resume_contract_survived=true proof_loop_entered=true source=${sourcePath}`]
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
	return { targetRef, commandHints, caseMemory, routingHints };
}
