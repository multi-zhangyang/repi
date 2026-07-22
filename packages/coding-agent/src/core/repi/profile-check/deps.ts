/** Profile-check deps bus. */
import type { ProfileCheckDeps } from "./types.ts";

let profileCheckDeps: ProfileCheckDeps | null = null;

export function configureProfileCheck(deps: ProfileCheckDeps): void {
	profileCheckDeps = deps;
}

export function d(): ProfileCheckDeps {
	if (!profileCheckDeps) throw new Error("profile-check not configured; call configureProfileCheck() first");
	return profileCheckDeps;
}
