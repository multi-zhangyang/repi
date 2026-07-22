/** Lean control-plane commands group. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";
import { controlPlaneCommandStats as stats } from "./commands-types.ts";

type MissionCheckpointStatus = "pending" | "done" | "blocked";

export function registerRepiControlPlaneLeanRouteMissionCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerCommand("re-route", {
		description: "Route a reverse/pentest task with REPI",
		handler: async (args: string) => {
			const route = deps.routeReconTask(args || "reverse/pentest task");
			stats.lastRoute = route;
			const activeTools = deps.activateToolsForRoute?.(route.domain) ?? [];
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: `${route.domain ?? ""} ${route.intent ?? ""} ${args || ""}`,
				target: undefined,
			}).slice(0, 3);
			deps.sendDisplayMessage(
				pi,
				"REPI Route",
				[
					deps.formatRoute(route),
					`skill: ${route.skillHint}`,
					...route.workflow.map((step: string) => `- ${step}`),
					...(activeTools.length > 0 ? [`active_tools: ${activeTools.join(", ")}`] : []),
					...(reverseNext.length
						? ["reverse_domain_next:", ...reverseNext.map((cmd: string) => `- next: ${cmd}`)]
						: []),
				].join("\n"),
			);
		},
	});
	registerCommand("re-mission", {
		description: "Show or update REPI mission blackboard: /re-mission [show|new|checkpoint] ...",
		handler: async (args: string) => {
			const trimmed = args.trim();
			if (trimmed.startsWith("new ")) {
				const task = trimmed.slice("new ".length).trim() || "reverse/pentest task";
				const mission = deps.writeCurrentMission(deps.createMission(task, deps.routeReconTask(task)));
				stats.currentMissionId = mission.id;
				stats.lastRoute = mission.route;
				const activated = deps.activateToolsForRoute?.(mission.route?.domain) ?? [];
				const reverseNext = reverseDomainCaptureNextCommands({
					routeOrBlob: `${mission.route?.domain ?? ""} ${task}`,
					target: mission.target,
				}).slice(0, 3);
				deps.sendDisplayMessage(
					pi,
					"REPI Mission Created",
					[
						deps.formatMission(mission),
						...(activated.length > 0 ? [`active_tools: ${activated.join(", ")}`] : []),
						...(reverseNext.length
							? ["reverse_domain_next:", ...reverseNext.map((cmd: string) => `- next: ${cmd}`)]
							: []),
					].join("\n"),
				);
				return;
			}
			if (trimmed.startsWith("checkpoint ")) {
				const [, checkpoint = "manual_check", status = "done", ...noteParts] = trimmed.split(/\s+/);
				const normalizedStatus = ["pending", "done", "blocked"].includes(status)
					? (status as MissionCheckpointStatus)
					: "done";
				const mission = deps.updateMissionCheckpoint(checkpoint, normalizedStatus, noteParts.join(" "));
				stats.currentMissionId = mission.id;
				deps.sendDisplayMessage(pi, "REPI Mission Check Updated", deps.formatMission(mission));
				return;
			}
			deps.sendDisplayMessage(pi, "REPI Mission", deps.buildMissionDigest());
		},
	});
}
