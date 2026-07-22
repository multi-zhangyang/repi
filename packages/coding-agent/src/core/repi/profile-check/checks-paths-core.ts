/** Profile-check path/file base helpers. */
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { getPackageDir } from "../../../config.ts";
import { type ArtifactScopeFilterOptions, latestScopedMarkdownArtifact } from "../artifact-scope.ts";
import { evidenceProfileCheckDir, readTextFile as readText } from "../storage.ts";
import { shellQuote } from "../target.ts";
import type { ProfileCheckRow, ProfileCheckStatus } from "./types.ts";

export function latestProfileCheckArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact({ kind: "profile-check", dir: evidenceProfileCheckDir(), ...options } as any);
}
export function findRepiRepoRoot(start?: string): string | undefined {
	let dir = resolve(start ?? process.cwd());
	for (;;) {
		if (
			existsSync(join(dir, "repi-profile", "SYSTEM.md")) &&
			existsSync(join(dir, "packages", "coding-agent", "src", "core", "recon-profile.ts"))
		) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}
export function repiRepoRoot(): string {
	return (
		findRepiRepoRoot(process.env.REPI_REPO_ROOT) ??
		findRepiRepoRoot(getPackageDir()) ??
		findRepiRepoRoot(process.cwd()) ??
		process.cwd()
	);
}
export function profileCheckWorkspacePath(relativePath: string): string {
	return join(repiRepoRoot(), relativePath);
}
export function profileCheckWritableDirCheck(id: string, dir: string): ProfileCheckRow {
	try {
		mkdirSync(dir, { recursive: true });
		const probe = join(dir, `.repi-profile-check-probe-${Date.now()}.tmp`);
		writeFileSync(probe, "ok\n", "utf-8");
		unlinkSync(probe);
		return { id, status: "pass", evidence: [`writable=${dir}`] };
	} catch (error) {
		return {
			id,
			status: "fail",
			evidence: [`not_writable=${dir}`, `error=${error instanceof Error ? error.message : String(error)}`],
			next: [`mkdir -p ${shellQuote(dir)}`, `re_profile_check install`],
		};
	}
}
export function profileCheckFileCheck(params: {
	id: string;
	path: string;
	markers?: string[];
	missingStatus?: ProfileCheckStatus;
}): ProfileCheckRow {
	const missingStatus = params.missingStatus ?? "warn";
	if (!existsSync(params.path)) {
		return {
			id: params.id,
			status: missingStatus,
			evidence: [`missing=${params.path}`],
			next: [`restore_or_install ${params.path}`],
		};
	}
	const text = readText(params.path);
	const missingMarkers = (params.markers ?? []).filter((marker: any) => !text.includes(marker));
	if (missingMarkers.length > 0) {
		return {
			id: params.id,
			status: "fail",
			evidence: [`path=${params.path}`, `missing_markers=${missingMarkers.join(",")}`],
			next: [`repair markers in ${params.path}`, "re_profile_check full"],
		};
	}
	return {
		id: params.id,
		status: "pass",
		evidence: [`path=${params.path}`, ...(params.markers?.length ? [`markers=${params.markers.join(",")}`] : [])],
	};
}
