/** Context-pack build state: mission/scope/memory gates. */
import { buildContextPackLoadState } from "./build-core-load.ts";
import { applyContextPackMemoryGates } from "./build-core-memory.ts";

export type ContextPackBuildState = Record<string, any>;

export function buildContextPackState(
	options: { target?: string; mode?: "pack" | "resume"; recordCompactResume?: boolean } = {},
): ContextPackBuildState {
	const load = buildContextPackLoadState(options);
	return applyContextPackMemoryGates(load);
}
