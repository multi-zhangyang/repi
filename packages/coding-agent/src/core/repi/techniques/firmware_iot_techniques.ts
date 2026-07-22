/**
 * Technique catalog slice: firmware_iot.
 */

import { FIRMWARE_IOT_TECHNIQUES_EARLY } from "./firmware_iot_techniques-early.ts";
import { FIRMWARE_IOT_TECHNIQUES_LATE } from "./firmware_iot_techniques-late.ts";
import type { TechniqueEntry } from "./types.ts";

export const FIRMWARE_IOT_TECHNIQUES: readonly TechniqueEntry[] = [
	...FIRMWARE_IOT_TECHNIQUES_EARLY,
	...FIRMWARE_IOT_TECHNIQUES_LATE,
];
