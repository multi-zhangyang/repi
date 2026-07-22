/** Profile-check install-script and source-corpus helpers. */
import { readTextFile as readText } from "../storage.ts";
import { profileCheckSourceFiles } from "./checks-path-lists.ts";
import { profileCheckFileCheck, profileCheckWorkspacePath } from "./checks-paths-core.ts";
import type { ProfileCheckRow } from "./types.ts";

export function profileCheckInstallScriptChecks(): ProfileCheckRow[] {
	return [
		profileCheckFileCheck({
			id: "install-script:install-repi",
			path: profileCheckWorkspacePath("scripts/reverse-agent/install-repi.sh"),
			markers: ["install-repi.sh", "init-repi-profile.mjs"],
			missingStatus: "warn",
		}),
		profileCheckFileCheck({
			id: "install-script:init-repi-profile",
			path: profileCheckWorkspacePath("scripts/reverse-agent/init-repi-profile.mjs"),
			markers: ["isolated-repi-profile", "settings.compaction"],
			missingStatus: "warn",
		}),
		profileCheckFileCheck({
			id: "install-script:repi-smoke",
			path: profileCheckWorkspacePath("scripts/reverse-agent/repi-smoke.mjs"),
			markers: ["repi-doctor", "model", "memory"],
			missingStatus: "warn",
		}),
		profileCheckFileCheck({
			id: "install-script:refresh-tool-index",
			path: profileCheckWorkspacePath("scripts/reverse-agent/refresh-tool-index.sh"),
			markers: ["TOOL"],
			missingStatus: "warn",
		}),
	];
}
export function profileCheckSourceCorpus(): { paths: string[]; text: string } {
	const paths = profileCheckSourceFiles().map((file: any) => file.path);
	const text = paths.map((path: any) => readText(path)).join("\n");
	return { paths, text };
}
