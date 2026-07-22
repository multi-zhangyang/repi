/** Ensure REPI storage layout. */
import { ensureRepiStorage } from "../storage.ts";
import { RECON_PROMPTS, RECON_SKILL_CONTENT } from "./prompts.ts";

export function ensureReconStorage(): void {
	ensureRepiStorage({
		skillContent: RECON_SKILL_CONTENT,
		prompts: RECON_PROMPTS,
		memoryEmbeddingProvider: { kind: "none" },
	});
}
