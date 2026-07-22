/** Context-pack DI core configure/d. */
import type { ContextPackDeps } from "./types.ts";

export type { ContextPackDeps } from "./types.ts";

let contextPackDeps: ContextPackDeps | null = null;

export function configureContextPack(deps: ContextPackDeps): void {
	contextPackDeps = deps;
}

export function d(): ContextPackDeps {
	if (!contextPackDeps) throw new Error("context-pack not configured");
	return contextPackDeps;
}
