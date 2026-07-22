/** Stable context scope identifiers (no memory product). */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { MissionState } from "../mission/types.ts";
import { readCurrentMission } from "../mission.ts";

export function contextSessionId(mission?: MissionState | null): string {
	const m = mission ?? readCurrentMission();
	if (m?.id) return `mission:${m.id}`;
	return `cwd:${createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12)}`;
}

/** Git HEAD when available; otherwise workspace path hash. Never return {}. */
export function contextBranchId(): string {
	try {
		const r = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
			encoding: "utf8",
			timeout: 2000,
			cwd: process.cwd(),
		});
		const name = (r.stdout || "").trim();
		if (r.status === 0 && name && name !== "HEAD") return `git-branch:${name}`;
		const full = spawnSync("git", ["rev-parse", "HEAD"], {
			encoding: "utf8",
			timeout: 2000,
			cwd: process.cwd(),
		});
		const sha = (full.stdout || "").trim();
		if (full.status === 0 && /^[0-9a-f]{7,40}$/i.test(sha)) return `git-sha:${sha.slice(0, 12)}`;
	} catch {
		/* ignore */
	}
	return `workspace:${createHash("sha256").update(process.cwd()).digest("hex").slice(0, 12)}`;
}
