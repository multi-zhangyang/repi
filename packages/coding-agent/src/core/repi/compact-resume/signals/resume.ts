/** Compaction auto-resume prompt and context-pack resume verify. */
import type { ReconCompactionResumeContract } from "../types.ts";

export function reconCompactionAutoResumePrompt(contract: ReconCompactionResumeContract): string {
	const commands = Array.from(
		new Set([
			"re_context resume",
			...contract.nextCommands.filter((command: any) =>
				/\bre_(?:context|operator|proof_loop|verifier|compiler|replayer|autofix|knowledge_graph)\b/i.test(command),
			),
		]),
	).slice(0, 10);
	return [
		"## REPI Auto Resume Trigger",
		"",
		"Compact finished and the REPI resume contract is verified. Resume the operation now; do not answer from stale pre-compact narrative.",
		"",
		"resume_contract:",
		...contract.resumeContract.map((item: any) => `- ${item}`),
		"",
		"verification:",
		...contract.verification.map((item: any) => `- ${item}`),
		"",
		"bounded_resume_commands:",
		...Array.from(
			new Set([
				...commands,
				"re_domain_proof_exit(partial_runtime_capture|runtime_capture_strong) show",
				"re_complete audit",
				"re_runtime_adapter run",
				"re_runtime_adapter run",
			]),
		)
			.slice(0, 12)
			.map((command: any) => `- ${command}`),
		"",
		"execution_order:",
		"1. Run or inspect `re_context resume` first.",
		"2. If reverse-heavy, run domain capture next before claim; otherwise build a bounded operator queue.",
		"3. Dispatch only one bounded operator step.",
		"4. If proof is partial/needs_repair, run `re_proof_loop run <target> 4 2`.",
		"5. Reverse/product proof gate: if resume contract/route is reverse-heavy or proof_exit is missing, run `re_domain_proof_exit show` then `re_complete audit` before claim promotion.",
		"6. Return Outcome → Key Evidence → Next Step.",
		"",
		`contextpath: ${contract.contextPath ?? "missing"}`,
	].join("\n");
}

/** reverse: compact-resume surfaces capture gates for reverse-heavy routes */
/** reverse: resume verify can flag missing runtime capture/bind_ready */
export { verifyContextPackResume } from "./resume-verify.ts";
