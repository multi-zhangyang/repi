/** Latest passive map context loader + target inference. */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { ensureRepiStorage, evidenceMapsDir, readTextFile } from "./storage.ts";
import { metadataValue, uniqueMatches } from "./text.ts";

export type PassiveMapContext = {
	path: string;
	timestamp: string;
	target?: string;
	signals: string[];
	candidates: string[];
};

/** Load the newest non-empty passive map artifact as structured context. */
export function latestPassiveMapContext(): PassiveMapContext | undefined {
	ensureRepiStorage();
	let files: string[] = [];
	try {
		files = readdirSync(evidenceMapsDir())
			.filter((file: any) => file.endsWith(".md"))
			.sort()
			.reverse();
	} catch {
		return undefined;
	}
	for (const file of files) {
		const path = join(evidenceMapsDir(), file);
		const text = readTextFile(path);
		if (!text.trim()) continue;
		const target = metadataValue(text, "target");
		const timestamp = metadataValue(text, "timestamp") ?? new Date(0).toISOString();
		const signals = text
			.split(/\r?\n/)
			.filter((line: any) => line.startsWith("- "))
			.map((line: any) => line.slice(2).trim())
			.filter(Boolean)
			.slice(0, 80);
		const candidates = uniqueMatches(
			text,
			/(?:^|\n)(\.{0,2}\/[^\s:\n]+|\/[^\s:\n]+):\s+.*(?:ELF|PE32|Mach-O|Android package|Zip archive|WebAssembly|Dalvik)/g,
			20,
		)
			.map((line: any) => line.replace(/^\n/, "").split(":")[0]?.trim())
			.filter((candidate): candidate is string => Boolean(candidate));
		return { path, timestamp, target, signals, candidates };
	}
	return undefined;
}

export function mapTargetUsable(target?: string): boolean {
	if (!target) return false;
	if (target === "." || target === "<TARGET>" || target === "<URL>") return false;
	return !/^target_missing=/.test(target);
}

export function inferTargetFromMap(map: PassiveMapContext | undefined, mission: any): string | undefined {
	if (!map) return undefined;
	if (mapTargetUsable(map.target)) return map.target;
	const wantsBinary =
		mission.route.domain === "Native reverse" ||
		mission.route.domain === "Pwn / exploit" ||
		mission.route.domain === "Mobile / Android";
	if (wantsBinary && map.candidates.length > 0) return map.candidates[0];
	return undefined;
}
