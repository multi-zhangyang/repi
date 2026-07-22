/** Web authz latest path + URL inference. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope-types.ts";
import { evidenceMapsDir, evidenceWebAuthzDir, readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";
import { latestLiveBrowserArtifactPath } from "./browser-pure.ts";
import { latestScopedMarkdownArtifact } from "./shared.ts";

export function latestWebAuthzStateArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("web_authz", evidenceWebAuthzDir(), options);
}

export function inferWebAuthzUrl(target?: string): string | undefined {
	const trimmed = target?.trim();
	if (trimmed && /^https?:\/\//i.test(trimmed)) return trimmed;
	if (trimmed) return undefined;
	for (const path of [
		latestLiveBrowserArtifactPath(),
		recentMarkdownArtifacts(evidenceMapsDir(), 1)[0],
		latestWebAuthzStateArtifactPath(),
	]) {
		if (!path) continue;
		const text = readText(path);
		const match = /(?:url|target|sample)[:=]\s*(https?:\/\/\S+)/i.exec(text)?.[1]?.replace(/["'`),]+$/, "");
		if (match) return match;
	}
	return trimmed || undefined;
}
