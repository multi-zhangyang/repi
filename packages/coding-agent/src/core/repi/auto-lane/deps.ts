/** Auto-lane deps bus. */
import type { AutoLaneDeps } from "./types.ts";

let autoLaneDeps: AutoLaneDeps | null = null;

export function configureAutoLane(deps: AutoLaneDeps): void {
	autoLaneDeps = deps;
}

export function d(): AutoLaneDeps {
	if (!autoLaneDeps) throw new Error("auto-lane not configured; call configureAutoLane() first");
	return autoLaneDeps;
}
