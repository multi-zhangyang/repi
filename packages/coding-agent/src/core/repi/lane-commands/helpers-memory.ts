/** Augment lane command pack from memory / case migrations. */

import { knowledgeCaseMemoryCandidates, structuredMemoryCommandCandidates } from "../memory-candidates.ts";
import type { MissionLane, MissionState } from "../mission.ts";
import { similarCaseIndexNotes } from "../playbooks.ts";
import { truncateMiddle } from "../text.ts";
import { memoryCommandCandidates } from "./deps.ts";
import type { LaneCommand } from "./types.ts";

export function augmentLaneCommandPackFromMemory(
	mission: MissionState,
	lane: MissionLane,
	target: string | undefined,
	commands: LaneCommand[],
	notes: string[],
	caseMemoryMigrations: string[],
): void {
	const candidates = memoryCommandCandidates(mission, lane, target);
	if (candidates.length > 0) {
		notes.push(`memory_reuse: merged ${candidates.length} historical command(s) from memory/playbooks.`);
		for (const candidate of candidates) {
			if (!commands.some((command: any) => command.command === candidate.command)) {
				commands.push({ label: candidate.label, command: candidate.command, evidence: candidate.evidence });
			}
		}
	}
	const structuredCandidates = structuredMemoryCommandCandidates(mission, lane, target);
	if (structuredCandidates.length > 0) {
		notes.push(
			`memory_event_reuse: merged ${structuredCandidates.length} structured event command(s) from events.jsonl.`,
		);
		for (const candidate of structuredCandidates) {
			if (!commands.some((command: any) => command.command === candidate.command)) {
				commands.push({ label: candidate.label, command: candidate.command, evidence: candidate.evidence });
			}
		}
	}
	const migrations = knowledgeCaseMemoryCandidates(mission, lane, target);
	if (migrations.length > 0) {
		notes.push(
			`case_memory_migration: merged ${migrations.length} command(s) from knowledge_graph similarity/promotions.`,
		);
		for (const candidate of migrations) {
			caseMemoryMigrations.push(
				`${candidate.label} score=${candidate.score} source=${candidate.source} evidence=${truncateMiddle(candidate.evidence.replace(/\s+/g, " "), 220)}`,
			);
			if (!commands.some((command: any) => command.command === candidate.command)) {
				commands.push({ label: candidate.label, command: candidate.command, evidence: candidate.evidence });
			}
		}
	}
	const caseNotes = similarCaseIndexNotes(mission, lane);
	if (caseNotes.length > 0) {
		notes.push(`case_index_hits: ${caseNotes.map((line: any) => truncateMiddle(line, 220)).join(" | ")}`);
	}
}
