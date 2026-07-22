/** REPI system/skill/prompt content. */
// lean product surface / Thin-kernel markers live in prompts-core

export { RECON_PROMPTS } from "./prompts-catalog.ts";
export {
	RECON_APPEND_SYSTEM_PROMPT,
	RECON_SKILL_CONTENT,
	RECON_SYSTEM_PROMPT,
	REPI_REASONING_DOCTRINE,
} from "./prompts-core.ts";

export const REPI_PROMPT_LEAN_MARKERS = [
	"Thin-kernel",
	"lean product surface",
	"REPI Cold Start (lean)",
	"execution-first",
	"do not dump reference",
	"RECON_SKILL_CONTENT",
] as const;
