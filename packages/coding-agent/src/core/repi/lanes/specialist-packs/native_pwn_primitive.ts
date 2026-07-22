/** Specialist pack handlers: native/pwn. */

import { applyWantsPwnPrimitiveAdvanced } from "./native_pwn_primitive-advanced.ts";
import { applyWantsPwnPrimitiveBasic } from "./native_pwn_primitive-basic.ts";
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsPwnPrimitive(ctx: SpecialistPackContext): void {
	applyWantsPwnPrimitiveBasic(ctx);
	applyWantsPwnPrimitiveAdvanced(ctx);
}
