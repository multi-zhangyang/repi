/** REPI prompt catalog entries. */
import { RECON_PROMPTS_CORE } from "./prompts-catalog-core.ts";
import { RECON_PROMPTS_DOMAIN } from "./prompts-catalog-domain.ts";

export const RECON_PROMPTS = [...RECON_PROMPTS_CORE, ...RECON_PROMPTS_DOMAIN];
