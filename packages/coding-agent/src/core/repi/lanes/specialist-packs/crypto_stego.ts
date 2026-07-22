/** Specialist pack handlers: crypto/stego. */

import { applyWantsCryptoStegoAdvanced } from "./crypto_stego-advanced.ts";
import { applyWantsCryptoStegoBasic } from "./crypto_stego-basic.ts";
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsCryptoStego(ctx: SpecialistPackContext): void {
	applyWantsCryptoStegoBasic(ctx);
	applyWantsCryptoStegoAdvanced(ctx);
}
