/** Claim release marker IO. */
// Landmark: latestClaimReleaseMarkerPath parseClaimReleaseMarker
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { readTextFile as readText } from "../evidence.ts";
import type { ClaimReleaseMarker } from "../runtime-types.ts";
import { evidenceClaimReleaseDir } from "../storage.ts";

export function configureClaimRelease(_deps: Record<string, never> = {}): void {}

export function latestClaimReleaseMarkerPath(): string | undefined {
	try {
		const candidates: Array<{ path: string; mtimeMs: number }> = [];
		for (const entry of readdirSync(evidenceClaimReleaseDir(), { withFileTypes: true })) {
			const directPath = join(evidenceClaimReleaseDir(), entry.name);
			const markerPath = entry.isDirectory() ? join(directPath, "result.json") : directPath;
			if (!markerPath.endsWith("result.json") || !existsSync(markerPath)) continue;
			candidates.push({ path: markerPath, mtimeMs: statSync(markerPath).mtimeMs });
		}
		return candidates.sort(
			(left: any, right: any) => right.mtimeMs - left.mtimeMs || right.path.localeCompare(left.path),
		)[0]?.path;
	} catch {
		return undefined;
	}
}

export function parseClaimReleaseMarker(path: string): ClaimReleaseMarker | undefined {
	try {
		return JSON.parse(readText(path)) as ClaimReleaseMarker;
	} catch {
		return undefined;
	}
}

export { writeLocalClaimReleaseMarker } from "./write.ts";
