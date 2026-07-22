/**
 * REPI resources: system prompts, skills, storage ensure, resource loader options.
 * Implementation under ./resources/*.
 */

export {
	builtinReconPrompts,
	builtinReconSkill,
	createReconResourceLoaderOptions,
	hasGoalModeSignature,
	isExternalGoalModeExtension,
	suppressLegacyReconConflicts,
} from "./resources/loader.ts";
export {
	RECON_APPEND_SYSTEM_PROMPT,
	RECON_PROMPTS,
	RECON_SKILL_CONTENT,
	RECON_SYSTEM_PROMPT,
	REPI_REASONING_DOCTRINE,
} from "./resources/prompts.ts";
export { ensureReconStorage } from "./resources/storage-ensure.ts";
// Doctor landmark: suppress external @narumitw/pi-goal via hasGoalModeSignature + isExternalGoalModeExtension + suppressLegacyReconConflicts
