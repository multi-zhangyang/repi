/** Context-pack format memory/budget/next static sections. */

import { formatContextPackMemoryEngineSections } from "./format-runtime-memory-engines.ts";
import { formatContextPackMemoryQueueSections } from "./format-runtime-memory-queues.ts";
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPackMemoryBudgetSections(pack: ContextPackFormatView): Array<string | undefined> {
	return [...formatContextPackMemoryEngineSections(pack), ...formatContextPackMemoryQueueSections(pack)];
}
