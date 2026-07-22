/** Operator control handlers: mission/kernel/context/autopilot/reflect/supervisor/operation/operator. */
import type { ExtensionAPI } from "../extensions/types.ts";
import type { MissionCheckpointStatus } from "./mission.ts";
import type { OperationExecution } from "./operator-step-deps.ts";
import { d } from "./operator-step-deps.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperatorControlCore(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const missionMatch = /^re[-_]mission(?:\s+(show|new|checkpoint))?(?:\s+(.+))?$/i.exec(command);
	if (missionMatch) {
		const action = (missionMatch[1] as "show" | "new" | "checkpoint" | undefined) ?? "show";
		const rest = missionMatch[2]?.trim();
		if (action === "new") {
			const task = rest || target || "reverse/pentest task";
			return done(d().formatMission(d().writeCurrentMission(d().createMission(task, d().routeReconTask(task)))));
		}
		if (action === "checkpoint") {
			const [checkpoint = "manual_check", status = "done", ...noteParts] = (rest ?? "").split(/\s+/).filter(Boolean);
			const normalizedStatus = ["pending", "done", "blocked"].includes(status)
				? (status as MissionCheckpointStatus)
				: "done";
			return done(d().formatMission(d().updateMissionCheckpoint(checkpoint, normalizedStatus, noteParts.join(" "))));
		}
		return done(d().buildMissionDigest());
	}
	const kernelMatch = /^re[-_]kernel(?:\s+(build|show|audit))?(?:\s+(.+))?$/i.exec(command);
	if (kernelMatch)
		return done(
			d().buildKernelOutput((kernelMatch[1] as "build" | "show" | "audit") ?? "build", {
				target: kernelMatch[2]?.trim() || target,
			}),
		);
	const contextMatch = /^re[-_]context\s+(pack|show|resume)?(?:\s+(.+))?$/i.exec(command);
	if (contextMatch)
		return done(
			d().buildContextOutput((contextMatch[1] as "pack" | "show" | "resume") ?? "pack", {
				target: contextMatch[2]?.trim() || target,
			}),
		);
	const autopilotMatch = /^re[-_](?:autopilot|auto)\s+(plan|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (autopilotMatch) {
		const action = (autopilotMatch[1] as "plan" | "run") ?? "run";
		const autoTarget = autopilotMatch[2]?.trim() || target;
		const maxAutoSteps = autopilotMatch[3] ? Number(autopilotMatch[3]) : undefined;
		return done(await d().runAutopilot(pi, { action, target: autoTarget, maxAutoSteps }));
	}
	const reflectMatch = /^re[-_]reflect\s+(plan|show|write)?(?:\s+(.+))?$/i.exec(command);
	if (reflectMatch)
		return done(
			d().buildReflectOutput((reflectMatch[1] as "plan" | "show" | "write") ?? "plan", {
				target: reflectMatch[2]?.trim() || target,
			}),
		);
	const supervisorMatch = /^re[-_]supervisor\s+(review|show|repair)?(?:\s+(.+))?$/i.exec(command);
	if (supervisorMatch)
		return done(
			await d().buildSupervisorOutput((supervisorMatch[1] as "review" | "show" | "repair") ?? "review", {
				target: supervisorMatch[2]?.trim() || target,
			}),
		);
	const operationMatch = /^re[-_]operation\s+(plan|next|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (operationMatch) {
		const action = (operationMatch[1] as "plan" | "next" | "show" | "run") ?? "next";
		const opTarget = operationMatch[2]?.trim() || target;
		const maxSteps = operationMatch[3] ? Number(operationMatch[3]) : 1;
		return done(
			action === "run"
				? await d().runOperationQueue(pi, { target: opTarget, maxSteps })
				: d().buildOperationOutput(action, { target: opTarget }),
		);
	}
	const operatorMatch = /^re[-_]operator(?:\s+(plan|show|dispatch|verify|escalate))?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(
		command,
	);
	if (operatorMatch) {
		const action = (operatorMatch[1] as "plan" | "show" | "dispatch" | "verify" | "escalate") ?? "plan";
		const opTarget = operatorMatch[2]?.trim() || target;
		const maxSteps = operatorMatch[3] ? Number(operatorMatch[3]) : 1;
		return done(
			action === "dispatch"
				? await d().dispatchOperatorQueue(pi, { target: opTarget, maxSteps })
				: d().buildOperatorOutput(action, { target: opTarget }),
		);
	}
	return undefined;
}
