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
import { toolchainDomainIdForRoute } from "./pure.ts";

export function configureDomainProofExit(_deps: Record<string, never> = {}): void {}

function corpusDirsForDomain(domainId?: string): string[] {
	const common = [
		evidenceLedgerPath(),
		evidenceMapsDir(),
		evidenceRunsDir(),
		evidenceProofLoopsDir(),
		evidenceVerifiersDir(),
	];
	const web = [evidenceBrowserDir(), evidenceWebAuthzDir(), evidenceReplayersDir()];
	const native = [evidenceNativeRuntimeDir(), evidenceExploitLabDir(), evidenceReplayersDir()];
	const mobile = [evidenceMobileRuntimeDir(), evidenceNativeRuntimeDir()];
	const id = domainId ?? "";
	if (/web-api|web-scan|frontend-js|authz/i.test(id))
		return [...common, ...web, evidenceCompilersDir(), evidenceKnowledgeDir()];
	if (/rev-native|pwn|exploit|malware/i.test(id))
		return [...common, ...native, evidenceCompilersDir(), evidenceKnowledgeDir()];
	if (/mobile/i.test(id)) return [...common, ...mobile, evidenceBrowserDir(), evidenceKnowledgeDir()];
	// Default: include all, but later path filter still applies mission task tokens.
	return [...common, ...web, ...native, ...mobile, evidenceCompilersDir(), evidenceKnowledgeDir()];
}

function pathMatchesMission(path: string, mission?: MissionState): boolean {
	if (!mission) return true;
	const base = path.split("/").pop() ?? path;
	const task = `${mission.task} ${mission.route.domain}`.toLowerCase();
	// Always keep ledger/maps/proof-loop/verifier generic files.
	if (/ledger\.md$|proof-loops|verifiers|compilers|knowledge/i.test(path)) return true;
	// Drop native /bin/true style fixtures from web missions.
	if (/web|api|http|douyin|browser|authz|js/i.test(task) && /native-runtime|\/bin-true|bin_true/i.test(path + base)) {
		return false;
	}
	// Prefer artifacts whose name overlaps URL/host tokens from task.
	const host = /https?:\/\/([^/\s]+)/i.exec(mission.task)?.[1]?.toLowerCase();
	if (host && /browser|web-authz|maps|runs/i.test(path)) {
		const hostToken = host.replace(/[^a-z0-9.-]/g, "");
		if (hostToken && base.toLowerCase().includes(hostToken.split(".")[0] ?? hostToken)) return true;
		// keep recent domain-generic if no host match yet
		return true;
	}
	return true;
}

export function domainProofExitArtifactCorpus(mission?: MissionState): {
	sources: string[];
	text: string;
	hash: string;
} {
	ensureReconStorage();
	const domainId = toolchainDomainIdForRoute(mission?.route.domain);
	const dirs = corpusDirsForDomain(domainId);
	const paths = new Set<string>();
	for (const dirOrFile of dirs) {
		if (dirOrFile.endsWith(".md")) {
			paths.add(dirOrFile);
			continue;
		}
		for (const p of recentMarkdownArtifacts(dirOrFile, 3)) paths.add(p);
	}
	const taskHints = mission
		? [
				`mission_task: ${mission.task}`,
				`mission_route: ${mission.route.domain}`,
				`mission_domain_id: ${domainId ?? "unmapped"}`,
				...mission.lanes.flatMap((lane: any) => [lane.name, lane.objective, ...lane.next]),
			]
		: [];
	const parts: string[] = [...taskHints];
	const sources: string[] = [];
	for (const path of paths) {
		if (!path || !existsSync(path)) continue;
		if (!pathMatchesMission(path, mission)) continue;
		const text = readText(path);
		if (!text.trim()) continue;
		sources.push(path);
		parts.push(`\n--- artifact:${path} ---\n${truncateMiddle(text, 12000)}`);
	}
	const corpus = parts.join("\n");
	return {
		sources,
		text: corpus,
		hash: createHash("sha256").update(corpus).digest("hex"),
	};
}
