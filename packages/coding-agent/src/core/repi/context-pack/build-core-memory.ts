/** Context-pack memory gates + lane/repair commands. */

import { repiMemorySettings } from "../memory-stubs.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { envBoolean } from "../text.ts";
import type { ContextPackLoadState } from "./build-core-load.ts";
import {
	buildMemoryOrchestratorReport,
	caseMemoryOperatorCommands,
	contextBranchId,
	contextSessionId,
	currentCaseMemoryLanePlan,
} from "./deps.ts";
import { commandTargetSuffix, contextPackArtifactPathFor } from "./index.ts";

export function applyContextPackMemoryGates(load: ContextPackLoadState): ContextPackLoadState {
	const { timestamp, mission, active, supervisor, reflection, target, repairQueue, options } = load;
	// Memory subsystem removed from product surface. Context pack stays lean by default.
	// Opt-in only: REPI_CONTEXT_MEMORY=1 (still no-op stubs unless a real memory module is reintroduced).
	const memorySettings = repiMemorySettings();
	const contextMemoryOptIn = envBoolean("REPI_CONTEXT_MEMORY") === true || envBoolean("REPI_FULL_SURFACE") === true;
	const includeContextMemory =
		contextMemoryOptIn &&
		Boolean(memorySettings.includeGlobalMemoryInContextPack || memorySettings.contextMemoryMode === "global");
	const includeMemoryRuntimeReports =
		contextMemoryOptIn &&
		Boolean(
			includeContextMemory ||
				memorySettings.contextMemoryMode === "scoped" ||
				memorySettings.autoRecall ||
				memorySettings.activeRecall,
		);
	const caseMemoryPlan = includeContextMemory ? currentCaseMemoryLanePlan(target) : undefined;
	const caseMemoryNextCommands = includeContextMemory ? caseMemoryOperatorCommands(caseMemoryPlan, target) : [];
	const reflectionReuseRules = includeContextMemory
		? Array.from(new Set(reflection?.reuseRules ?? [])).slice(0, 24)
		: [];
	const route = mission?.route.domain ?? reflection?.route ?? supervisor?.route;
	const mode = options.mode ?? "pack";
	const memoryOrchestrator = includeMemoryRuntimeReports
		? buildMemoryOrchestratorReport({
				phase: mode === "resume" ? "post-compact" : "pre-compact",
				query: target ?? route ?? mission?.task,
				route,
				target,
				write: true,
			})
		: undefined;
	const contextPath = contextPackArtifactPathFor({ timestamp, route, target, mode });
	const scope = {
		missionId: mission?.id ?? reflection?.missionId ?? supervisor?.missionId,
		sessionId: contextSessionId(mission),
		cwd: process.cwd(),
		workspaceRoot: process.cwd(),
		target,
		branchId: contextBranchId(),
	};
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${route ?? ""} ${target ?? ""} ${active?.name ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${route ?? ""} ${active?.name ?? ""} context_pack`,
				target,
				includeGates: true,
			}).slice(0, 2)
		: [];
	const laneCommands = active
		? [
				...reverseNext,
				`re_lane plan ${active.name}${commandTargetSuffix(target)}`,
				`re_lane run ${active.name}${commandTargetSuffix(target)}`,
				...(active.next.some((item: any) => /^\[auto:/i.test(item)) ? [`re_lane run-auto ${active.name} 2`] : []),
			]
		: [...reverseNext, "re_mission show", "re_map <target> 2"];
	const repairCommands = repairQueue
		.filter((item: any) => /^\/?re[-_]/i.test(item.trim()))
		.map((item: any) => item.trim().replace(/^\//, ""));
	const commanderCommands = (supervisor?.commanderMergeQueue ?? [])
		.filter((item: any) => /^\/?re[-_]/i.test(item.trim()))
		.map((item: any) => item.trim().replace(/^\//, ""));

	return {
		...load,
		memorySettings,
		contextMemoryOptIn,
		includeContextMemory,
		includeMemoryRuntimeReports,
		caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		route,
		mode,
		memoryOrchestrator,
		contextPath,
		scope,
		laneCommands,
		repairCommands,
		commanderCommands,
	};
}
