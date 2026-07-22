/**
 * Technique catalog slice: crypto_stego.
 */

import { CRYPTO_STEGO_TECHNIQUES_EARLY } from "./crypto_stego_techniques-early.ts";
import { CRYPTO_STEGO_TECHNIQUES_LATE } from "./crypto_stego_techniques-late.ts";
import type { TechniqueEntry } from "./types.ts";

export const CRYPTO_STEGO_TECHNIQUES: readonly TechniqueEntry[] = [
	...CRYPTO_STEGO_TECHNIQUES_EARLY,
	...CRYPTO_STEGO_TECHNIQUES_LATE,
];
