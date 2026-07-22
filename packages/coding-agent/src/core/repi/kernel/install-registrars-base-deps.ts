/**
 * Lean product install base deps (static reverse/proof/control surface).
 * Split into mission + reverse/runtime bags; assembled here for registrars.
 */
import { installBaseMissionDeps } from "./install-registrars-base-deps-mission.ts";
import { installBaseReverseDeps } from "./install-registrars-base-deps-reverse.ts";

const _baseDeps = {
	...installBaseMissionDeps,
	...installBaseReverseDeps,
} as Record<string, any>;

export { _baseDeps as repiInstallBaseDeps };
export { installBaseMissionDeps, installBaseReverseDeps };
