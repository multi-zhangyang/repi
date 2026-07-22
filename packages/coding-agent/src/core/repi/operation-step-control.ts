/** Operation step handlers: decision/lane/map/kernel control plane. */
import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;
type Blocked = (output: string) => OperationExecution;

export async function tryExecuteOperationControlStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
	blocked: Blocked,
): Promise<OperationExecution | undefined> {
	const decisionMatch = /^re[-_]decision[-_]core\s+(plan|tick|run)\b(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (decisionMatch) {
		const action = decisionMatch[1] as "plan" | "tick" | "run";
		const decisionTarget = decisionMatch[2]?.trim() || target;
		const maxSteps = decisionMatch[3] ? Number(decisionMatch[3]) : 1;
		return done(
			action === "run"
				? await d().runDecisionCore(pi, { target: decisionTarget, maxSteps })
				: d().buildDecisionCoreOutput(action, { target: decisionTarget }),
		);
	}
	const laneMatch = /^re_lane\s+(plan|run|run-auto)\s+(\S+)(?:\s+(.+))?$/i.exec(command);
	if (laneMatch) {
		const action = laneMatch[1] as "plan" | "run" | "run-auto";
		const laneName = laneMatch[2];
		const laneTarget = laneMatch[3]?.trim() || target;
		if (action === "run-auto")
			return done(await d().runAutoLaneChain(pi, { lane: laneName, target: laneTarget, maxSteps: 1 }));
		const mission =
			d().readCurrentMission() ??
			d().writeCurrentMission(d().createMission("manual mission", d().routeReconTask("reverse/pentest task")));
		const lane = d().activeLane(mission, laneName);
		if (!lane) return blocked(`lane not found: ${laneName}`);
		d().updateMissionCheckpoint("repro_commands_ready", "done", `operation:${lane.name}`);
		const pack = d().laneCommandPack(mission, lane, laneTarget);
		if (action === "plan") return done(d().formatLaneCommandPack(pack));
		return done(await d().runLaneCommandPack(pi, pack));
	}
	if (/^re_map\b/i.test(command)) {
		const parts = command.split(/\s+/).slice(1);
		const last = parts.at(-1);
		const depth = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
		const mapTarget = parts.join(" ") || target;
		return done(await d().runPassiveMap(pi, { target: mapTarget, depth }));
	}
	const kernelMatch = /^re[-_]kernel(?:\s+(build|show|audit))?(?:\s+(.+))?$/i.exec(command);
	if (kernelMatch)
		return done(
			d().buildKernelOutput((kernelMatch[1] as "build" | "show" | "audit") ?? "build", {
				target: kernelMatch[2]?.trim() || target,
			}),
		);
	return undefined;
}
