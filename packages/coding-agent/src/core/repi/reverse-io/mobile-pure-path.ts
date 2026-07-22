/** Mobile runtime latest path + package inference. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope-types.ts";
import {
	evidenceMapsDir,
	evidenceMobileRuntimeDir,
	readTextFile as readText,
	recentMarkdownArtifacts,
} from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./shared-deps.ts";

export function latestMobileRuntimeArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("mobile_runtime", evidenceMobileRuntimeDir(), options);
}

export function inferMobilePackageName(target?: string, packageName?: string): string | undefined {
	const explicit = packageName?.trim();
	if (explicit) return explicit.replace(/^package:/i, "");
	const trimmed = target?.trim();
	if (trimmed && /^[A-Za-z][\w]*(?:\.[A-Za-z][\w]*){1,}$/.test(trimmed) && !trimmed.endsWith(".apk")) return trimmed;
	for (const path of [recentMarkdownArtifacts(evidenceMapsDir(), 1)[0], latestMobileRuntimeArtifactPath()]) {
		if (!path) continue;
		const text = readText(path);
		const match = /(?:package(?:Name)?|applicationId)[:=\s"']+([A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+)/i.exec(text)?.[1];
		if (match) return match;
	}
	return undefined;
}
