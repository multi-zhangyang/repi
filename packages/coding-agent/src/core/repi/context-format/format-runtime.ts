/** Context-pack format memory/budget/next sections. */

import { formatContextPackMemoryBudgetSections } from "./format-runtime-memory.ts";
import { formatContextPackReverseNextLines } from "./format-runtime-reverse.ts";
import type { ContextPackFormatView } from "./types.ts";

export function formatContextPackRuntimeSections(pack: ContextPackFormatView): Array<string | undefined> {
	return [...formatContextPackMemoryBudgetSections(pack), ...formatContextPackReverseNextLines(pack)];
}
