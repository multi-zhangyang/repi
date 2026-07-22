/**
 * Technique catalog slice: identity-ad.
 */

import { IDENTITY_AD_TECHNIQUES_EARLY } from "./identity_ad_techniques-early.ts";
import { IDENTITY_AD_TECHNIQUES_LATE } from "./identity_ad_techniques-late.ts";
import type { TechniqueEntry } from "./types.ts";

export const IDENTITY_AD_TECHNIQUES: readonly TechniqueEntry[] = [
	...IDENTITY_AD_TECHNIQUES_EARLY,
	...IDENTITY_AD_TECHNIQUES_LATE,
];
