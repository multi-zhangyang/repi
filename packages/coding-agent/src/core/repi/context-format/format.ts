/** Pure context-pack formatter. */

import { formatContextPackHeaderSections } from "./format-header.ts";
import { formatContextPackRuntimeSections } from "./format-runtime.ts";
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPack(pack: ContextPackFormatView, path?: string): string {
	return [...formatContextPackHeaderSections(pack, path), ...formatContextPackRuntimeSections(pack)]
		.filter(Boolean)
		.join("\n");
}
