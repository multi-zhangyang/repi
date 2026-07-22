/** Narrative tool: re_lane_specialist_pack (reverse command-pack gate). */
import { Type } from "typebox";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiSpecialistPackTool(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_lane_specialist_pack",
		label: "RE Lane Specialist Command Pack",
		description:
			"Inspect ReLaneSpecialistCommandPackCheckV1: route → re_lane command pack → analyzer anchors → self-heal commands → proof-exit bridge for each professional domain.",
		promptSnippet:
			"Use re_lane_specialist_pack before broad execution when a reverse/pentest route feels generic or under-tooled.",
		promptGuidelines: [
			"Call re_lane_specialist_pack show to choose the right lane seeds, command pack markers, analyzer anchors, and self-heal commands.",
			"Follow with re_lane plan/run and re_domain_proof_exit so command-pack evidence closes the domain proof exit.",
		],
		parameters: Type.Object({ action: Type.Union([Type.Literal("show")]), domain: Type.Optional(Type.String()) }),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const report = deps.buildReLaneSpecialistCommandPackGate(params.domain);
			deps.updateMissionCheckpoint(
				"repro_commands_ready",
				report.readyDomainCount === report.domainCount ? "done" : "blocked",
				"ReLaneSpecialistCommandPackCheckV1",
			);
			return {
				content: [
					{
						type: "text" as const,
						text: deps.truncateMiddle(deps.formatReLaneSpecialistCommandPackGate(report), 20000),
					},
				],
				details: {
					action: params.action,
					domain: params.domain,
					closure: report.closure,
					readyDomainCount: report.readyDomainCount,
				} as Record<string, unknown>,
			};
		},
	});
}
