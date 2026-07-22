/**
 * Specialist reverse/pentest command packs.
 *
 * Domain handler bodies live under ./specialist-packs/*; this file computes
 * enablement flags and orchestrates progressive-disclosure command injection.
 */
import type { MissionLane, MissionState } from "../mission.ts";
import { shellQuote } from "../target.ts";
import { pythonString } from "./specialist-packs/helpers.ts";
import type { SpecialistPackContext } from "./specialist-packs/types.ts";
import { appendSpecialistReverseBridge, applySpecialistPackHandlers } from "./specialist-packs-apply.ts";
import { detectSpecialistWants } from "./specialist-packs-wants.ts";

export type LaneCommand = {
	label: string;
	command: string;
	evidence: string;
};

export function appendSpecialistRuntimeCommands(
	mission: MissionState,
	lane: MissionLane,
	target: string | undefined,
	commands: LaneCommand[],
	notes: string[],
): void {
	const domain = mission.route.domain;
	const laneName = lane.name.toLowerCase();
	const context = [
		mission.task,
		domain,
		mission.route.intent,
		mission.route.toolchain,
		mission.route.skillHint,
		mission.route.workflow.join(" "),
		lane.name,
		lane.objective,
		lane.next.join(" "),
		target ?? "",
	]
		.join("\n")
		.toLowerCase();
	const targetArg = target ? shellQuote(target) : "<TARGET>";
	const targetPython = pythonString(target ?? "<TARGET>");
	const targetIsUrl = Boolean(target && /^https?:\/\//i.test(target));
	const urlArg = targetIsUrl ? shellQuote(target!) : "<URL>";
	const urlPython = pythonString(targetIsUrl ? target! : "<URL>");
	const specialists: string[] = [];
	const add = (label: string, command: string, evidence: string) => {
		if (commands.some((existing: any) => existing.label === label && existing.command === command)) return;
		commands.push({ label, command, evidence });
	};
	const wants = detectSpecialistWants({
		domain,
		laneName,
		context,
		task: mission.task,
		target,
	});
	const ctx: SpecialistPackContext = {
		domain,
		laneName,
		context,
		targetArg,
		targetPython,
		urlArg,
		urlPython,
		target,
		targetIsUrl,
		targetLooksPcap: wants.targetLooksPcap,
		targetLooksApk: wants.targetLooksApk,
		targetLooksFirmware: wants.targetLooksFirmware,
		targetLooksMemoryImage: wants.targetLooksMemoryImage,
		targetLooksIpa: wants.targetLooksIpa,
		add,
		specialists,
		wantsBrowser: wants.wantsBrowser,
		wantsWebScanner: wants.wantsWebScanner,
		wantsJsSigning: wants.wantsJsSigning,
		wantsPwnPrimitive: wants.wantsPwnPrimitive,
		wantsExploitReliability: wants.wantsExploitReliability,
		wantsPcap: wants.wantsPcap,
		wantsFirmware: wants.wantsFirmware,
		wantsMemoryForensics: wants.wantsMemoryForensics,
		wantsCryptoStego: wants.wantsCryptoStego,
		wantsAgentSecurity: wants.wantsAgentSecurity,
		wantsMalware: wants.wantsMalware,
		wantsCloudRuntime: wants.wantsCloudRuntime,
		wantsIdentityAd: wants.wantsIdentityAd,
		wantsAndroidMobile: wants.wantsAndroidMobile,
		wantsIosMobile: wants.wantsIosMobile,
		wantsFridaTrace: wants.wantsFridaTrace,
		wantsNativeDeep: wants.wantsNativeDeep,
	};
	applySpecialistPackHandlers(ctx);
	appendSpecialistReverseBridge(ctx, notes);
}
