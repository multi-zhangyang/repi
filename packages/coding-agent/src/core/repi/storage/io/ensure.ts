/** ensureRepiStorage layout bootstrap. */
import { existsSync, mkdirSync } from "node:fs";
import { builtinPromptFilePath, builtinSkillFilePath } from "../paths.ts";
import { chmodPrivate, writePrivateTextFile } from "./files.ts";
import { repiStorageDefaultFiles } from "./layout-defaults.ts";
import { repiStorageLayoutDirs } from "./layout-dirs.ts";

export type RepiStorageDefaultsOptions = {
	skillContent?: string;
	prompts?: Array<{ name: string; description: string; argumentHint?: string; content: string }>;
	memoryEmbeddingProvider?: Record<string, unknown>;
};

export function ensureRepiStorage(options: RepiStorageDefaultsOptions = {}): void {
	const dirs = repiStorageLayoutDirs();
	for (const dir of dirs) {
		mkdirSync(dir, { recursive: true });
		chmodPrivate(dir, 0o700);
	}
	const defaults = repiStorageDefaultFiles({
		memoryEmbeddingProvider: options.memoryEmbeddingProvider as any,
	});
	for (const [path, content] of defaults) {
		if (!existsSync(path)) writePrivateTextFile(path, content);
		else chmodPrivate(path, 0o600);
	}
	if (options.skillContent !== undefined) {
		const skillFile = builtinSkillFilePath();
		if (!existsSync(skillFile)) {
			writePrivateTextFile(
				skillFile,
				`---\nname: reverse-pentest-orchestrator\ndescription: Built-in REPI orchestrator for reverse engineering, CTF, pwn, web/API pentest, JS signing, mobile, firmware, cloud/container, identity/AD, DFIR, malware analysis, and agent/LLM boundary testing tasks.\n---\n\n${options.skillContent}\n`,
			);
		} else {
			chmodPrivate(skillFile, 0o600);
		}
	}
	for (const prompt of options.prompts ?? []) {
		const promptFile = builtinPromptFilePath(prompt.name);
		if (!existsSync(promptFile)) {
			writePrivateTextFile(
				promptFile,
				`---\ndescription: ${prompt.description}\nargument-hint: "${prompt.argumentHint ?? ""}"\n---\n${prompt.content}\n`,
			);
		} else {
			chmodPrivate(promptFile, 0o600);
		}
	}
}
