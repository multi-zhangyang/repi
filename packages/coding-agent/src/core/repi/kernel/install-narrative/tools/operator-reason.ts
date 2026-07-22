/** Narrative operator tool: re_reason. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerReasonTool(registerTool: ToolRegistrar, _pi: ExtensionAPI, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_reason",
		label: "RE Reason",
		description:
			"Render a Pentesting Task Tree snapshot of the live mission (lanes/checkpoints, attack-graph gaps, decision-core rules, domain proof-exit closure, evidence tail, last lane-run decision) and either return it with a reasoning scaffold (mode=canvas) or dispatch a real process-isolated planner subagent to produce the next-step plan (mode=planner). Use this to reason like a pentester: form falsifiable hypotheses, pick the distinguishing probe, decide the next action with rationale.",
		promptSnippet:
			"Reason over a live Pentesting Task Tree snapshot before acting; dispatch a real planner subagent for the next-step plan when the objective is ambiguous.",
		promptGuidelines: [
			"Call re_reason(mode=canvas) to step back and reason over the whole task tree (lanes, gaps, proof-exit, last run).",
			"Call re_reason(mode=planner, focus=<question>) to hand the PTT snapshot to a real planner subagent and get a structured next-step plan.",
		],
		parameters: Type.Object({
			mode: Type.Optional(Type.Union([Type.Literal("canvas"), Type.Literal("planner")])),
			target: Type.Optional(Type.String()),
			focus: Type.Optional(Type.String()),
			timeoutMs: Type.Optional(Type.Number()),
			inheritMcp: Type.Optional(Type.Boolean()),
		}),
		executionMode: "parallel",
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const mode = params.mode ?? "canvas";
			const snapshot = deps.buildPentestingTaskTreeSnapshot({ target: params.target, focus: params.focus });
			if (mode === "planner") {
				const timeoutMs = Math.min(600000, Math.max(1000, params.timeoutMs ?? 300000));
				const task = [
					"You are reasoning over a REPI Pentesting Task Tree snapshot. Produce the next-step plan.",
					params.focus ? `focus question: ${params.focus}` : "",
					"Return: assessment (one line), ranked hypotheses (each with a falsifying observation), distinguishing_probe, next_action (runnable command/tool + rationale), what_to_verify (falsification probe + who verifies), abandon_candidates, ptt_update (node status changes).",
					"",
					snapshot.text,
				]
					.filter(Boolean)
					.join("\n");
				const mgr = deps.createAgentThreadManager({ cwd: ctx.cwd });
				try {
					const started = await mgr.spawnThread({
						specName: "planner",
						task,
						timeoutMs,
						inheritMcp: params.inheritMcp ?? true,
					});
					const final = await mgr.awaitRun(started.runId);
					const merge = mgr.mergeRun(started.runId);
					const mergeText = merge?.text ?? "(no merge output)";
					const summary = [
						`re_reason: mode=planner status=${final.status} exitCode=${final.exitCode ?? "n/a"}`,
						`run_id: ${final.runId}`,
					].join("\n");
					return {
						content: [{ type: "text" as const, text: `${summary}\n\n${mergeText}` }],
						details: {
							mode,
							runId: final.runId,
							spec: final.specName,
							status: final.status,
						} as Record<string, unknown>,
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text" as const,
								text: `re_reason planner blocked: ${String((error as Error).message ?? error)}\n\n${snapshot.text}`,
							},
						],
						details: { mode, error: true } as Record<string, unknown>,
					};
				}
			}
			const scaffold = [
				"",
				"## reasoning scaffold (fill before acting)",
				"- assessment: <progress vs root objective, one line>",
				"- hypotheses: <ranked, most-likely first; each with a falsifying observation>",
				"- distinguishing_probe: <the observation that separates the top hypotheses>",
				"- next_action: <command/tool + rationale; must be runnable now>",
				"- what_to_verify: <falsification probe + who verifies (re_subagent verifier?)>",
				"- abandon_candidates: <lanes/hypotheses to drop and why>",
				"- ptt_update: <which task-tree nodes change status and to what>",
			].join("\n");
			return {
				content: [{ type: "text" as const, text: `${snapshot.text}${scaffold}` }],
				details: {
					mode,
					gapsCount: snapshot.gapsCount,
					missingProofExits: snapshot.missingProofExits,
					reverseNext: reverseDomainCaptureNextCommands({
						routeOrBlob: `${snapshot.missingProofExits?.join(" ") ?? ""} ${deps.readCurrentMission?.()?.route?.domain ?? ""}`,
						target: deps.readCurrentMission?.()?.target,
						includeGates: true,
					}).slice(0, 3),
					lastRunVerdict: snapshot.lastRunVerdict,
				} as Record<string, unknown>,
			};
		},
	});
}
