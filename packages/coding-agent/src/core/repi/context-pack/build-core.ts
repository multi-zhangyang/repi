/** Context-pack build core (mission/scope/memory gates + assemble). */

import { assembleContextPackFromState } from "./build-core-assemble.ts";
import { buildContextPackState } from "./build-core-state.ts";
import type { ContextPackArtifact } from "./types.ts";

export function buildContextPack(
	options: { target?: string; mode?: "pack" | "resume"; recordCompactResume?: boolean } = {},
): ContextPackArtifact {
	const state = buildContextPackState(options);
	return assembleContextPackFromState(state);
}
