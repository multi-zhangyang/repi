/** Historical playbook command candidates with reverse domain seed. */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { readTextFile as readText } from "./evidence.ts";
import type { MemoryCommandCandidate } from "./playbooks-deps.ts";
import { normalizeHistoricalCommand } from "./playbooks-deps.ts";
import { playbookScore } from "./playbooks-maintain.ts";
import { playbookBashBlocks, playbookQualityScore } from "./playbooks-metrics.ts";
import { ensureReconStorage } from "./resources.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import { memoryPath, memoryPlaybooksDir } from "./storage.ts";
import { metadataValue } from "./text.ts";

export function similarCaseIndexNotes(mission: any, lane: any): string[] {
	const text = readText(memoryPath("case-index.md"));
	const terms = [mission.route.domain, lane.name, ...mission.task.split(/\s+/)]
		.map((term: any) => term.toLowerCase())
		.filter((term: any) => term.length >= 3);
	return text
		.split(/\r?\n/)
		.filter((line: any) => {
			const lower = line.toLowerCase();
			return terms.some((term: any) => lower.includes(term));
		})
		.slice(-5);
}

export function memoryCommandCandidates(mission: any, lane: any, target?: string): MemoryCommandCandidate[] {
	ensureReconStorage();
	const candidates: MemoryCommandCandidate[] = [];
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			`${mission?.route?.domain ?? ""} ${lane?.name ?? ""} ${mission?.task ?? ""} ${target ?? ""}`,
		);
	if (reverseHeavy) {
		const domainNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${mission?.route?.domain ?? ""} ${lane?.name ?? ""} ${mission?.task ?? ""} ${target ?? ""}`,
			target: target ?? mission?.task,
		}).slice(0, 4);
		for (const [index, command] of domainNext.entries()) {
			candidates.push({
				label: `reverse-domain-capture:${index + 1}`,
				command,
				evidence: "playbook memory reverse-heavy route seeds shared domain capture next",
				source: "reverse-domain-capture",
				score: 96 - index,
			});
		}
	}
	let files: string[] = [];
	try {
		files = readdirSync(memoryPlaybooksDir())
			.filter((file: any) => file.endsWith(".md"))
			.sort()
			.reverse()
			.slice(0, 20);
	} catch {
		return candidates;
	}
	for (const file of files) {
		const path = join(memoryPlaybooksDir(), file);
		const text = readText(path);
		const quality = playbookQualityScore(text);
		if (quality < 6) continue;
		const score = playbookScore(text, mission, lane);
		if (score < 3) continue;
		const oldTarget = metadataValue(text, "target");
		for (const [index, block] of playbookBashBlocks(text).entries()) {
			const command = normalizeHistoricalCommand(block, oldTarget === "<none>" ? undefined : oldTarget, target);
			if (!command) continue;
			candidates.push({
				label: `memory:${file.replace(/\.md$/, "")}:${index + 1}`,
				command,
				evidence: `reused from ${path} score=${score} quality=${quality}`,
				source: path,
				score,
			});
			if (candidates.length >= 8) break;
		}
	}
	const seen = new Set<string>();
	return candidates
		.sort((a: any, b: any) => b.score - a.score)
		.filter((candidate: any) => {
			if (seen.has(candidate.command)) return false;
			seen.add(candidate.command);
			return true;
		})
		.slice(0, 4);
}
