/** Narrative tool: re_challenge. */
import { Type } from "typebox";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiChallengeTool(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_challenge",
		label: "RE Challenge",
		description:
			"Independently challenge a claimed finding via a real process-isolated verifier subagent (Reflexion-style adversarial self-critique). The verifier treats the claim as a hypothesis, re-runs the minimal repro and actively searches for counter-evidence, then returns proved/refuted/inconclusive with the repro and contradicting observations. Call this before declaring a finding proved.",
		promptSnippet: "Try to falsify a claimed finding with an independent verifier subagent before accepting it.",
		promptGuidelines: [
			"Before declaring a finding proved, dispatch re_challenge with the claim and the minimal repro command.",
			"The verifier defaults to refuted/inconclusive if it cannot reproduce or finds counter-evidence; only proved survives a stable repro with no contradictions.",
		],
		parameters: Type.Object({
			claim: Type.String(),
			evidence: Type.Optional(Type.String()),
			reproCommand: Type.Optional(Type.String()),
			target: Type.Optional(Type.String()),
			timeoutMs: Type.Optional(Type.Number()),
			inheritMcp: Type.Optional(Type.Boolean()),
		}),
		executionMode: "parallel",
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const timeoutMs = Math.min(600000, Math.max(1000, params.timeoutMs ?? 300000));
			const task = [
				"You are an independent REPI verifier. Your job is to FALSIFY the claim below. Treat it as a hypothesis, not a fact.",
				"- Re-run the minimal repro (if provided) and compare observations to the claim.",
				"- Actively search for counter-evidence: alternative explanations, contradictory observations, repro failure, flakiness, environment drift.",
				"- Default to refuted or inconclusive if you cannot reproduce or find supporting evidence; return proved only if the repro is stable and no counter-evidence exists.",
				"Return exactly one verdict line `verdict: proved | refuted | inconclusive`, then `repro: <command + result>`, `counter_evidence: <observations or none>`, `notes: <one line>`.",
				"",
				`claim: ${params.claim}`,
				params.evidence ? `evidence: ${params.evidence}` : "",
				params.reproCommand ? `repro_command: ${params.reproCommand}` : "",
				params.target ? `target: ${params.target}` : "",
			]
				.filter(Boolean)
				.join("\n");
			const mgr = deps.createAgentThreadManager({ cwd: ctx.cwd });
			try {
				const started = await mgr.spawnThread({
					specName: "verifier",
					task,
					timeoutMs,
					inheritMcp: params.inheritMcp ?? true,
				});
				const final = await mgr.awaitRun(started.runId);
				const merge = mgr.mergeRun(started.runId);
				const mergeText = merge?.text ?? "(no merge output)";
				const verdictMatch = mergeText.match(/verdict:\s*(proved|refuted|inconclusive)/i);
				const verdict = verdictMatch ? verdictMatch[1].toLowerCase() : "inconclusive";
				const summary = [
					`re_challenge: spec=verifier status=${final.status} exitCode=${final.exitCode ?? "n/a"}`,
					`verdict: ${verdict}`,
					`run_id: ${final.runId}`,
				].join("\n");
				return {
					content: [{ type: "text" as const, text: `${summary}\n\n${mergeText}` }],
					details: {
						verdict,
						runId: final.runId,
						spec: final.specName,
						status: final.status,
					} as Record<string, unknown>,
				};
			} catch (error) {
				return {
					content: [
						{ type: "text" as const, text: `re_challenge blocked: ${String((error as Error).message ?? error)}` },
					],
					details: { verdict: "inconclusive", error: true } as Record<string, unknown>,
				};
			}
		},
	});
}
