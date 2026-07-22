/** Case-memory lane plan helpers. */

import { memoryPath } from "./case-memory-deps.ts";
import type { LaneCommandPack } from "./lane-commands/types.ts";
import type { MissionState } from "./mission/types.ts";
import type { CaseMemoryLanePlan } from "./proof-loop-runtime/types.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import { shellQuote } from "./target.ts";
import { slug, truncateMiddle, uniqueNonEmpty } from "./text.ts";

export function caseMemoryProofLaneIndex(mission: MissionState, currentIndex: number): number {
	const proofPattern = /control-flow|runtime|proof|prove|verify|primitive|poc|exploit|pivot-proof|privilege/i;
	const after = mission.lanes.findIndex(
		(lane, index) => index > currentIndex && lane.status !== "done" && proofPattern.test(lane.name),
	);
	if (after >= 0) return after;
	return mission.lanes.findIndex(
		(lane, index) => index !== currentIndex && lane.status !== "done" && proofPattern.test(lane.name),
	);
}

export function formatCaseMemoryLanePlan(plan: CaseMemoryLanePlan): string {
	return [
		"case_memory_lane_plan:",
		`action: ${plan.action}`,
		`reason: ${plan.reason}`,
		plan.targetLane ? `target_lane: ${plan.targetLane}` : undefined,
		plan.addedLane ? `added_lane: ${plan.addedLane}` : undefined,
		plan.skippedLane ? `skipped_lane: ${plan.skippedLane}` : undefined,
		"migrations:",
		...(plan.migrations.length > 0 ? plan.migrations.map((item: any) => `- ${item}`) : ["- none"]),
		"next:",
		...(plan.next.length > 0 ? plan.next.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function caseMemoryMigrationScore(item: string): number {
	const match = /\bscore=(\d+)/i.exec(item);
	return match?.[1] ? Number(match[1]) : 0;
}

export function caseMemoryAutoNext(pack: LaneCommandPack): string[] {
	const migrated = pack.commands.filter(
		(command: any) =>
			/case-memory|knowledge-|worker-promotion|adaptive-routing|dispatcher-feedback|dispatcher-promotion-playbook|autonomous-budget-ledger/i.test(
				command.label,
			) ||
			/knowledge|similarity|promotion|adaptive routing|case memory|dispatcher feedback|dispatcher routing|score_decay|historical_score_decay|autonomous budget|demote_dispatcher|demote_lane|high-score|formal_playbook/i.test(
				command.evidence,
			) ||
			/compact[-_]resume/i.test(command.label) ||
			/compact[_ -]resume|compact_resume_case_memory|compact_resume_routing_hints/i.test(command.evidence),
	);
	const selected = (migrated.length > 0 ? migrated : pack.commands).slice(0, 6);
	const next = selected.map((command: any) => {
		const label = `case-memory-${slug(command.label)}`;
		const evidence = truncateMiddle(command.evidence.replace(/\s+/g, " "), 240);
		return `[auto:${label}] ${command.command} # evidence: case_memory_lane_plan migrated command; ${evidence}`;
	});
	if (next.length === 0) {
		next.push(
			`[auto:case-memory-index] sed -n '1,240p' ${shellQuote(memoryPath("knowledge-graph-index.md"))} 2>/dev/null || true # evidence: case_memory_lane_plan knowledge graph index audit`,
		);
	}
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${pack.route ?? ""} ${pack.lane ?? ""} ${pack.target ?? ""} ${next.join(" ")}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${pack.route ?? ""} ${pack.lane ?? ""}`,
				target: pack.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return uniqueNonEmpty([...reverseNext, ...next], 12);
}
