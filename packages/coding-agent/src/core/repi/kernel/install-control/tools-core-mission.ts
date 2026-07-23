/** Lean control-plane tool: re_mission. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { clearMissionReverseBound } from "../install-reverse/tools-capture-inflight.ts";
import type { ControlPlaneToolDeps } from "./tools-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlCoreMissionTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerTool({
		name: "re_mission",
		label: "RE Mission",
		description: "Create, inspect, or update the REPI mission blackboard and completion checkpoints.",
		promptSnippet: "Track reverse/pentest mission lanes, checkpoints, and next actions.",
		promptGuidelines: [
			"Use re_mission to keep task state explicit: route, lanes, evidence checkpoints, replay/report/memory checkpoints.",
			"Reverse-heavy missions require reverse_proof_exit_ready before claim promotion.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("show"), Type.Literal("new"), Type.Literal("checkpoint")])),
			task: Type.Optional(Type.String()),
			check: Type.Optional(Type.String()),
			status: Type.Optional(Type.Union([Type.Literal("pending"), Type.Literal("done"), Type.Literal("blocked")])),
			note: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "show";
			if (action === "new") {
				const task = params.task ?? "reverse/pentest task";
				const nextRoute = deps.routeReconTask(task);
				try {
					const prev = deps.readCurrentMission?.();
					const prevDomain = String(prev?.route?.domain ?? "").trim();
					const nextDomain = String(nextRoute?.domain ?? "").trim();
					if (!prevDomain || !nextDomain || prevDomain !== nextDomain) clearMissionReverseBound();
				} catch {
					clearMissionReverseBound();
				}
				const mission = deps.writeCurrentMission(deps.createMission(task, nextRoute));
				const activated = deps.activateToolsForRoute?.(mission.route?.domain) ?? [];
				const reverseNext = reverseDomainCaptureNextCommands({
					routeOrBlob: `${mission.route?.domain ?? ""} ${task}`,
					target: mission.target,
					includeGates: true,
				}).slice(0, 3);
				return {
					content: [
						{
							type: "text" as const,
							text: [
								deps.formatMission(mission),
								...(activated.length > 0 ? [`active_tools: ${activated.join(", ")}`] : []),
								...(reverseNext.length
									? ["reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)]
									: []),
							].join("\n"),
						},
					],
					details: { ...(mission as unknown as Record<string, unknown>), activeTools: activated },
				};
			}
			if (action === "checkpoint") {
				const mission = deps.updateMissionCheckpoint(
					params.check ?? "manual_check",
					params.status ?? "done",
					params.note,
				);
				return {
					content: [{ type: "text" as const, text: deps.formatMission(mission) }],
					details: mission as unknown as Record<string, unknown>,
				};
			}
			return {
				content: [{ type: "text" as const, text: deps.buildMissionDigest() }],
				details: { path: deps.currentMissionPath() },
			};
		},
	});
}
