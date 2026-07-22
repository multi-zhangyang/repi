/** Native pure path helpers. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import {
	evidenceMapsDir,
	evidenceNativeRuntimeDir,
	evidenceRunsDir,
	readTextFile as readText,
	recentMarkdownArtifacts,
} from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./shared.ts";

export function latestNativeRuntimeArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("native_runtime", evidenceNativeRuntimeDir(), options);
}

export function inferNativeRuntimeTarget(target?: string): string | undefined {
	const trimmed = target?.trim();
	if (trimmed) return trimmed;
	for (const path of [
		recentMarkdownArtifacts(evidenceMapsDir(), 1)[0],
		recentMarkdownArtifacts(evidenceRunsDir(), 1)[0],
		latestNativeRuntimeArtifactPath(),
	]) {
		if (!path) continue;
		const text = readText(path);
		const explicit = /^target:\s*(.+)$/m.exec(text)?.[1]?.trim();
		if (explicit && !/^<.*>$|none$/i.test(explicit)) return explicit;
		const candidate = /binary[_ -]?candidate[^\n]*?([./\w-]+(?:\.elf|\.bin|\.so|vuln|challenge|license)?)/i
			.exec(text)?.[1]
			?.trim();
		if (candidate && !/^<.*>$|none$/i.test(candidate)) return candidate;
	}
	return undefined;
}
