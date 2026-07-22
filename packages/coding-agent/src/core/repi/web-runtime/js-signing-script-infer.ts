/** Infer JS signing target. */
import { evidenceMapsDir, readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";

export function inferJsSigningTarget(target?: string, url?: string): string | undefined {
	const candidate = (url ?? target)?.trim();
	if (!candidate) {
		const latestMap = recentMarkdownArtifacts(evidenceMapsDir(), 1)[0];
		const mapText = latestMap ? readText(latestMap) : "";
		const targetLine = /^target=(https?:\/\/\S+)/m.exec(mapText)?.[1];
		if (targetLine) return targetLine.replace(/["'`]+$/g, "");
		const urlLine = /(https?:\/\/[^\s"'`<>]+)/i.exec(mapText)?.[1];
		return urlLine?.replace(/[),.;]+$/g, "");
	}
	if (/^https?:\/\//i.test(candidate)) return candidate;
	return candidate;
}

/** Capture script written to workdir; uses only single-quoted JS strings internally. */
