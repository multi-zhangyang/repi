/** Attack-graph next actions and path helpers. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import type { MissionState } from "../mission.ts";
import type { PassiveMapContext } from "../passive-map.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceGraphsDir } from "../storage.ts";
import {
	activeLane,
	createBootstrapPlan,
	inferTargetFromMap,
	latestScopedMarkdownArtifact,
	recommendedToolsForRoute,
} from "./deps.ts";

export function latestAttackGraphArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("attack_graph", evidenceGraphsDir(), options);
}

export function attackGraphNextActions(
	mission: MissionState | undefined,
	map: PassiveMapContext | undefined,
): string[] {
	const reverseBlob = JSON.stringify({ mission, map });
	const reverseOpen =
		/technique|proof_exit|mitre|cwe|native-runtime|pwn|malware|firmware|bind_ready|pending_runtime_capture|reverse_kind|reverse|exploit|binary|rop|frontend|js|browser|authz|mobile/i.test(
			reverseBlob,
		);
	const reverseCommands = reverseOpen
		? reverseDomainCaptureNextCommands({
				routeOrBlob: reverseBlob,
				target: (map as any)?.target ?? (mission as any)?.target,
			})
		: [];
	const actions: string[] = [...reverseCommands];
	if (!mission) {
		return Array.from(
			new Set([...reverseCommands, "re_mission new <task>", "re_map <target> <depth>", "re_graph build"]),
		).slice(0, 12);
	}
	const active = activeLane(mission);
	if (!map) actions.push("re_map <target> <depth>");
	if (active) {
		const target = inferTargetFromMap(map, mission) ?? (map as any)?.target;
		actions.push(`re_lane plan ${active.name}${target ? ` ${target}` : ""}`.trim());
		actions.push(`re_lane run ${active.name}${target ? ` ${target}` : ""}`.trim());
		if (Array.isArray(active.next) && active.next.some((item: string) => /^\[auto:/i.test(item))) {
			actions.push(`re_lane run-auto ${active.name} 2`);
		}
	}
	const missingTools = recommendedToolsForRoute(mission.route)
		.map((tool: string) => createBootstrapPlan([tool])[0])
		.filter(
			(item: any): item is { tool: string; known: boolean; present: boolean } =>
				Boolean(item) && item.known && !item.present,
		)
		.map((item: any) => item.tool)
		.slice(0, 10);
	if (missingTools.length > 0) actions.push(`re_bootstrap plan ${missingTools.join(" ")}`);
	if (!reverseOpen) actions.push("re_complete audit");
	else actions.push(...reverseCommands);
	return Array.from(new Set(actions)).slice(0, 12);
}
