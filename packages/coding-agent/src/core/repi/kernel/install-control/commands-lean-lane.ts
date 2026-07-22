/** Lean control-plane commands group. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";

type MissionLaneStatus = string;

export function registerRepiControlPlaneLeanLaneCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerCommand("re-lane", {
		description: "Drive REPI mission lanes: /re-lane [show|next|done|block|add|set|plan|run|run-auto] ...",
		handler: async (args: string) => {
			const trimmed = args.trim();
			const [action = "show", lane, ...rest] = trimmed.split(/\s+/);
			if (action === "show") {
				const mission = deps.readCurrentMission();
				deps.sendDisplayMessage(pi, "REPI Lanes", mission ? deps.formatLaneQueue(mission) : "no active mission");
				return;
			}
			if (action === "run-auto") {
				const laneName = lane && /^\d+$/.test(lane) ? undefined : lane;
				const maxText = laneName ? rest[0] : lane;
				const maxSteps = maxText && /^\d+$/.test(maxText) ? Number(maxText) : undefined;
				const text = await deps.runAutoLaneChain(pi, { lane: laneName, maxSteps });
				deps.sendDisplayMessage(pi, "REPI Lane Auto Runner", text);
				return;
			}
			if (action === "plan" || action === "run") {
				const mission =
					deps.readCurrentMission() ??
					deps.writeCurrentMission(
						deps.createMission("manual mission", deps.routeReconTask("reverse/pentest task")),
					);
				const selectedLane = deps.activeLane(mission, lane);
				if (!selectedLane) {
					deps.sendDisplayMessage(pi, "REPI Lane Command Pack", "no active lane");
					return;
				}
				deps.updateMissionCheckpoint("repro_commands_ready", "done", `lane-command-pack:${selectedLane.name}`);
				const pack = deps.laneCommandPack(mission, selectedLane, rest.join(" ") || undefined);
				const text = action === "run" ? await deps.runLaneCommandPack(pi, pack) : deps.formatLaneCommandPack(pack);
				deps.sendDisplayMessage(pi, "REPI Lane Command Pack", text);
				return;
			}
			if (action === "add") {
				const [name = "manual-lane", objective = "manual objective", nextText = ""] = trimmed
					.slice("add".length)
					.split("::")
					.map((part: any) => part.trim());
				const mission = deps.updateMissionLane({
					action: "add",
					lane: name,
					objective,
					next: nextText
						? nextText
								.split(",")
								.map((step: any) => step.trim())
								.filter(Boolean)
						: [],
				});
				deps.sendDisplayMessage(pi, "REPI Lane Added", deps.formatLaneQueue(mission));
				return;
			}
			const mission = deps.updateMissionLane({
				action: action === "done" || action === "block" || action === "set" || action === "next" ? action : "next",
				lane,
				status: action === "set" && rest[0] ? (rest[0] as MissionLaneStatus) : undefined,
				note: rest.join(" "),
			});
			deps.sendDisplayMessage(pi, "REPI Lane Updated", deps.formatLaneQueue(mission));
		},
	});
	registerCommand("re-lane-specialist-pack", {
		description: "Show REPI re_lane specialist command-pack closure: /re-lane-specialist-pack [show] [domain]",
		handler: async (args: string) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			if (parts[0] === "show") parts.shift();
			const report = deps.buildReLaneSpecialistCommandPackGate(parts.join(" ") || undefined);
			deps.updateMissionCheckpoint(
				"repro_commands_ready",
				report.readyDomainCount === report.domainCount ? "done" : "blocked",
				"ReLaneSpecialistCommandPackCheckV1",
			);
			deps.sendDisplayMessage(
				pi,
				"REPI Lane Specialist Command Pack",
				deps.truncateMiddle(deps.formatReLaneSpecialistCommandPackGate(report), 20000),
			);
		},
	});
}
