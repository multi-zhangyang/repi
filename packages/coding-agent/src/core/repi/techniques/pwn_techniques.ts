/**
 * Technique catalog slice: pwn.
 */

import { PWN_ADVANCED_TECHNIQUES } from "./pwn_advanced_techniques.ts";
import { PWN_CLASSIC_TECHNIQUES } from "./pwn_classic_techniques.ts";
import { PWN_HEAP_TECHNIQUES } from "./pwn_heap_techniques.ts";
import type { TechniqueEntry } from "./types.ts";

export const PWN_TECHNIQUES: readonly TechniqueEntry[] = [
	...PWN_HEAP_TECHNIQUES,
	...PWN_CLASSIC_TECHNIQUES,
	...PWN_ADVANCED_TECHNIQUES,
];
