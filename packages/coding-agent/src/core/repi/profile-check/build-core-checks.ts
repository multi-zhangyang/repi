/** Profile-check row assembly. */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { toolIndexPath } from "../lane-run-mission/deps.ts";
import { reconDir } from "../storage/paths/core.ts";
import { evidenceProfileCheckDir, evidenceRunsDir } from "../storage/paths/evidence-reverse.ts";
import { profileCheckFileCheck, profileCheckInstallScriptChecks, profileCheckWritableDirCheck } from "./checks.ts";
import { profileCheckInstalledFiles, profileCheckSourceFiles } from "./checks-path-lists.ts";
import type { ProfileCheckMode, ProfileCheckRow } from "./types.ts";

export function buildProfileCheckRows(mode: ProfileCheckMode): ProfileCheckRow[] {
	const installScriptChecks = profileCheckInstallScriptChecks();
	return [
		...profileCheckSourceFiles()
			.filter((file: any) => mode !== "install" || existsSync(file.path))
			.map((file: any) =>
				profileCheckFileCheck({ id: file.id, path: file.path, markers: file.markers, missingStatus: "warn" }),
			),
		...profileCheckInstalledFiles(mode).map((file: any) =>
			profileCheckFileCheck({
				id: file.id,
				path: file.path,
				markers: file.markers,
				missingStatus: file.missingStatus,
			}),
		),
		...(mode === "install"
			? installScriptChecks.filter((check: any) => !check.evidence.some((item: any) => item.startsWith("missing=")))
			: installScriptChecks),
		profileCheckWritableDirCheck("storage:evidence-profile-check", evidenceProfileCheckDir()),
		profileCheckWritableDirCheck("storage:evidence-runs", evidenceRunsDir()),
		profileCheckWritableDirCheck("storage:memory", join(reconDir(), "memory")),
		profileCheckFileCheck({ id: "storage:tool-index", path: toolIndexPath(), markers: ["REPI Tool Index"] }),
	];
}
