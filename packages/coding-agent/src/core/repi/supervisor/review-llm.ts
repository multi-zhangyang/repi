/** Supervisor LLM critique. */
/** Supervisor worker review, merge budget, and LLM critique. */

import { createAgentThreadManager } from "../../agent-thread-manager.ts";
import { envBoolean, truncateMiddle } from "../text.ts";
import { formatSupervisor } from "./core.ts";
import { parseSupervisorCritique } from "./review-budget.ts";
import type { SupervisorArtifact } from "./types.ts";

export async function buildSupervisorLlmCritique(
	supervisor: SupervisorArtifact,
	options: { cwd?: string; target?: string; task?: string },
): Promise<string | undefined> {
	if (!options.cwd || envBoolean("REPI_AGENT_THREAD")) return undefined;
	const timeoutMs = 240000;
	const baseReview = formatSupervisor(supervisor);
	const payload = [
		"You are the REPI supervisor critic (Reflexion-style adversarial review).",
		"Below is a rule-based supervisor review of specialist worker packets and swarm executions.",
		"Your job is to ADVERSARIALLY critique it: find what the rule score missed.",
		"Identify (a) contradictions or weak evidence that passed as 'done',",
		"(b) worker handoffs that are attempted-as-proved without a real proof-exit (no repro, no counter-evidence check, missing technique.proof_exit=/query.proof_exit=),",
		"(b2) reverse claims that name technique/mitre/cwe without proof_exit or domain proof-exit closure,",
		"(c) the single highest-leverage next action,",
		"(d) any worker whose claim should be re-dispatched to an independent verifier/reverser subagent for falsification.",
		"Default to a stricter verdict than the rule score when evidence is thin.",
		"Output EXACTLY these lines (no prose before/after):",
		"supervisor_verdict: <one of pass|watch|repair|blocked>",
		"critique: <one line, the most important failure the rule score missed>",
		"repair_queue: <comma-separated concrete re_* actions, or none>",
		"redispatch: <spec=verifier|reverser|operator; task=<one short task>> or none",
		"notes: <one line>",
		"",
		"--- rule-based supervisor review ---",
		truncateMiddle(baseReview, 12000),
		...(options.target ? [`target: ${options.target}`] : []),
		...(options.task ? [`task: ${options.task}`] : []),
	].join("\n");
	const mgr = createAgentThreadManager({ cwd: options.cwd });
	try {
		const started = await mgr.spawnThread({
			specName: "verifier",
			task: payload,
			timeoutMs,
			inheritMcp: true,
		});
		const final = await mgr.awaitRun(started.runId);
		const merge = mgr.mergeRun(started.runId);
		const mergeText = merge?.text ?? `(no merge output; status=${final.status})`;
		const parsed = parseSupervisorCritique(mergeText);
		return [
			`spec=verifier; runId=${final.runId}; status=${final.status}; supervisor_verdict=${parsed.verdict}`,
			parsed.text,
		].join("\n");
	} catch (error) {
		return `spec=verifier; status=blocked; llm-supervisor: ${truncateMiddle(String((error as Error).message ?? error), 240)}`;
	}
}
