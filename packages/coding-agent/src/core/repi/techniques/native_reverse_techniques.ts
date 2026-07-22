/** Technique catalog slice: native-reverse. */

import { NATIVE_REVERSE_DYNAMIC_TECHNIQUES } from "./native_reverse_dynamic.ts";
import { NATIVE_REVERSE_PWN_TECHNIQUES } from "./native_reverse_pwn.ts";
import { NATIVE_REVERSE_UNPACK_TECHNIQUES } from "./native_reverse_unpack.ts";
import type { TechniqueEntry } from "./types.ts";

export const NATIVE_REVERSE_TECHNIQUES: readonly TechniqueEntry[] = [
	...NATIVE_REVERSE_UNPACK_TECHNIQUES,
	...NATIVE_REVERSE_PWN_TECHNIQUES,
	...NATIVE_REVERSE_DYNAMIC_TECHNIQUES,
];
