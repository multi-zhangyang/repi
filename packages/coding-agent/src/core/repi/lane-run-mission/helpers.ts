/** Lane run mission pure helpers with reverse domain followups. */

import { readCurrentMission } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { truncateMiddle } from "../text.ts";
import { writeCurrentMission } from "./deps.ts";

export function significantLaneFindings(analysis: any): boolean {
	const joined = analysis.findings.join("\n");
	return !/no high-signal anchors parsed|tool\/target\/runtime error surfaced/.test(joined);
}

export function followupNextItems(analysis: any): string[] {
	const base = [...analysis.followups, ...analysis.critic.selfHeal].map((command: any) =>
		truncateMiddle(`[auto:${command.label}] ${command.command} # evidence: ${command.evidence}`, 900),
	);
	const blob = [
		analysis.nextLane ?? "",
		...(analysis.findings ?? []),
		...base,
		JSON.stringify(analysis.followups ?? []),
	].join("\n");
	if (
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			blob,
		)
	) {
		const domainNext = reverseDomainCaptureNextCommands({
			routeOrBlob: blob,
			target: String(analysis.nextLane ?? analysis.target ?? "lane"),
		}).map((command: any) => truncateMiddle(`[auto:reverse_capture] ${command}`, 900));
		return Array.from(new Set([...base, ...domainNext])).slice(0, 24);
	}
	return base;
}

export function findLaneIndex(mission: any, name?: string): number {
	if (name) {
		const exact = mission.lanes.findIndex((lane: any) => lane.name === name);
		if (exact >= 0) return exact;
		const lower = name.toLowerCase();
		const partial = mission.lanes.findIndex((lane: any) => lane.name.toLowerCase().includes(lower));
		if (partial >= 0) return partial;
	}
	const active = mission.lanes.findIndex((lane: any) => lane.status === "in_progress");
	if (active >= 0) return active;
	return mission.lanes.findIndex((lane: any) => lane.status === "pending");
}

export function findLaneIndexByHint(mission: any, hint?: string): number {
	if (!hint) return -1;
	const variants = hint
		.toLowerCase()
		.split(/[/|,]+/)
		.map((part: any) => part.trim())
		.filter(Boolean);
	for (const variant of variants) {
		const exact = mission.lanes.findIndex((lane: any) => lane.name.toLowerCase() === variant);
		if (exact >= 0) return exact;
		const partial = mission.lanes.findIndex((lane: any) => {
			const name = lane.name.toLowerCase();
			return name.includes(variant) || variant.includes(name);
		});
		if (partial >= 0) return partial;
	}
	const tokens = hint
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((token: any) => token.length >= 3);
	return mission.lanes.findIndex((lane: any) => {
		const name = lane.name.toLowerCase();
		return tokens.some((token: any) => name.includes(token));
	});
}

export function annotateMissionLane(laneName: string, note: string): any | undefined {
	const mission = readCurrentMission();
	if (!mission) return undefined;
	const index = findLaneIndex(mission, laneName);
	if (index < 0) return mission;
	const timestamp = new Date().toISOString();
	const lanes = mission.lanes.map((lane: any, laneIndex: any) =>
		laneIndex === index ? { ...lane, note: truncateMiddle(note, 500), updatedAt: timestamp } : lane,
	);
	return writeCurrentMission({ ...mission, lanes });
}

export function applyLaneCheckpointCompletions(checkpoints: any[], laneName: string): any[] {
	const lower = laneName.toLowerCase();
	const done = new Set<string>();
	if (/map|triage|surface|observe|mitigation/.test(lower)) {
		done.add("passive_map_done");
	}
	if (/prove|proof|runtime|poc|exploit|verify|state|primitive|control/.test(lower)) {
		done.add("minimal_path_proven");
	}
	if (/report/.test(lower)) {
		done.add("report_or_writeup_ready");
	}
	if (done.size === 0) return checkpoints;
	const updatedAt = new Date().toISOString();
	return checkpoints.map((checkpoint: any) =>
		done.has(checkpoint.name) ? { ...checkpoint, status: "done", note: `lane:${laneName}`, updatedAt } : checkpoint,
	);
}

export function splitMetadataList(value?: string): string[] {
	if (!value || value === "none") return [];
	return value
		.split(/[, ]+/)
		.map((item: any) => item.trim())
		.filter((item: any) => item && item !== "none");
}
