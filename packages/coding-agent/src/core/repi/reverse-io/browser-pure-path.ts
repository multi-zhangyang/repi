/** Browser pure: latest path + URL inference. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { evidenceBrowserDir, evidenceMapsDir, readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./shared.ts";

export function latestLiveBrowserArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("browser", evidenceBrowserDir(), options);
}

export function inferBrowserUrl(target?: string): string | undefined {
	const trimmed = target?.trim();
	if (trimmed) return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
	const latestMap = recentMarkdownArtifacts(evidenceMapsDir(), 1)[0];
	const mapText = latestMap ? readText(latestMap) : "";
	const targetLine = /^target=(https?:\/\/\S+)/m.exec(mapText)?.[1];
	if (targetLine) return targetLine.replace(/["'`]+$/g, "");
	const urlLine = /(https?:\/\/[^\s"'`<>]+)/i.exec(mapText)?.[1];
	return urlLine?.replace(/[),.;]+$/g, "");
}
