/** Profile-check source/installed path list builders. */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { ProfileCheckMode, ProfileCheckStatus } from "./types.ts";

function workspacePath(rel: string): string {
	let dir = resolve(process.cwd());
	for (;;) {
		if (existsSync(join(dir, "packages", "coding-agent", "src", "core", "recon-profile.ts"))) {
			return join(dir, rel);
		}
		const parent = resolve(dir, "..");
		if (parent === dir) break;
		dir = parent;
	}
	return join(process.cwd(), rel);
}

export function profileCheckSourceFiles(): Array<{ id: string; path: string; markers: string[] }> {
	return [
		{
			id: "source:recon-profile",
			path: workspacePath("packages/coding-agent/src/core/recon-profile.ts"),
			markers: ["recon-profile"],
		},
		{ id: "source:system-md", path: workspacePath("repi-profile/SYSTEM.md"), markers: ["SYSTEM"] },
	];
}

export function profileCheckInstalledFiles(
	_mode: ProfileCheckMode,
): Array<{ id: string; path: string; markers: string[]; missingStatus: ProfileCheckStatus }> {
	return [{ id: "installed:settings", path: "", markers: ["settings"], missingStatus: "warn" }];
}
