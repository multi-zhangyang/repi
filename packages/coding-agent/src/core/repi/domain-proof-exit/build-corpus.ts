/** Domain proof-exit artifact corpus. */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import type { MissionState } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import {
	evidenceBrowserDir,
	evidenceCompilersDir,
	evidenceExploitLabDir,
	evidenceKnowledgeDir,
	evidenceLedgerPath,
	evidenceMapsDir,
	evidenceMobileRuntimeDir,
	evidenceNativeRuntimeDir,
	evidenceProofLoopsDir,
	evidenceReplayersDir,
	evidenceRunsDir,
	evidenceVerifiersDir,
	evidenceWebAuthzDir,
	readTextFile as readText,
	recentMarkdownArtifacts,
} from "../storage.ts";
import { truncateMiddle } from "../text.ts";

export function configureDomainProofExit(_deps: Record<string, never> = {}): void {}

export function domainProofExitArtifactCorpus(mission?: MissionState): {
	sources: string[];
	text: string;
	hash: string;
} {
	ensureReconStorage();
	const paths = new Set<string>([
		evidenceLedgerPath(),
		...recentMarkdownArtifacts(evidenceRunsDir(), 4),
		...recentMarkdownArtifacts(evidenceMapsDir(), 2),
		...recentMarkdownArtifacts(evidenceBrowserDir(), 2),
		...recentMarkdownArtifacts(evidenceWebAuthzDir(), 2),
		...recentMarkdownArtifacts(evidenceNativeRuntimeDir(), 2),
		...recentMarkdownArtifacts(evidenceMobileRuntimeDir(), 2),
		...recentMarkdownArtifacts(evidenceExploitLabDir(), 2),
		...recentMarkdownArtifacts(evidenceReplayersDir(), 2),
		...recentMarkdownArtifacts(evidenceVerifiersDir(), 2),
		...recentMarkdownArtifacts(evidenceCompilersDir(), 2),
		...recentMarkdownArtifacts(evidenceProofLoopsDir(), 2),
		...recentMarkdownArtifacts(evidenceKnowledgeDir(), 2),
	]);
	const taskHints = mission
		? [
				`mission_task: ${mission.task}`,
				`mission_route: ${mission.route.domain}`,
				...mission.lanes.flatMap((lane: any) => [lane.name, lane.objective, ...lane.next]),
			]
		: [];
	const parts: string[] = [...taskHints];
	const sources: string[] = [];
	for (const path of paths) {
		if (!path || !existsSync(path)) continue;
		const text = readText(path);
		if (!text.trim()) continue;
		sources.push(path);
		parts.push(`\n--- artifact:${path} ---\n${truncateMiddle(text, 16000)}`);
	}
	const corpus = parts.join("\n");
	return {
		sources,
		text: corpus,
		hash: createHash("sha256").update(corpus).digest("hex"),
	};
}
