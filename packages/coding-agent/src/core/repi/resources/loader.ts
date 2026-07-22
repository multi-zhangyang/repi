/** Builtin skill/prompt loaders. */
import type { PromptTemplate } from "../../prompt-templates.ts";
import type { DefaultResourceLoaderOptions } from "../../resource-loader.ts";
import type { Skill } from "../../skills.ts";
import { createSyntheticSourceInfo } from "../../source-info.ts";
import { REPI_PROMPT_BASE as RECON_PROMPT_BASE, REPI_SOURCE as RECON_SOURCE } from "../profile.ts";
import { builtinPromptFilePath, builtinSkillFilePath } from "../storage.ts";
import { suppressLegacyReconConflicts } from "./loader-suppress.ts";
import { RECON_PROMPTS } from "./prompts.ts";
import { ensureReconStorage } from "./storage-ensure.ts";

export {
	hasGoalModeSignature,
	isExternalGoalModeExtension,
	suppressLegacyReconConflicts,
} from "./loader-suppress.ts";

export function builtinReconSkill(): Skill {
	ensureReconStorage();
	const filePath = builtinSkillFilePath();
	return {
		name: "reverse-pentest-orchestrator",
		description: "REPI built-in reverse/pentest execution orchestrator",
		filePath,
		baseDir: filePath.replace(/[/\\]SKILL\.md$/, ""),
		sourceInfo: createSyntheticSourceInfo(filePath, { source: RECON_SOURCE, scope: "temporary" }),
		disableModelInvocation: false,
	};
}

export function builtinReconPrompts(): PromptTemplate[] {
	ensureReconStorage();
	return RECON_PROMPTS.map((prompt: any) => {
		const filePath = builtinPromptFilePath(prompt.name);
		return {
			...prompt,
			filePath,
			sourceInfo: createSyntheticSourceInfo(filePath, {
				source: RECON_SOURCE,
				scope: "temporary",
				baseDir: RECON_PROMPT_BASE,
			}),
		};
	});
}

export function createReconResourceLoaderOptions(): Partial<DefaultResourceLoaderOptions> {
	return {
		extensionsOverride: suppressLegacyReconConflicts,
		skillsOverride: (base) => {
			if (base.skills.some((skill: any) => skill.name === "reverse-pentest-orchestrator")) return base;
			return { skills: [builtinReconSkill(), ...base.skills], diagnostics: base.diagnostics };
		},
		promptsOverride: (base) => {
			const existing = new Set(base.prompts.map((prompt: any) => prompt.name));
			const additions = builtinReconPrompts().filter((prompt: any) => !existing.has(prompt.name));
			return { prompts: [...additions, ...base.prompts], diagnostics: base.diagnostics };
		},
	};
}
