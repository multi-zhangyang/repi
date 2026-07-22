/** Legacy recon extension conflict suppression helpers. */
import type { Extension, LoadExtensionsResult } from "../../extensions/types.ts";
import { REPI_COMMAND_NAMES as RECON_COMMAND_NAMES, REPI_TOOL_NAMES as RECON_TOOL_NAMES } from "../profile.ts";

function hasReconSignature(extension: Extension): boolean {
	const hasTools = RECON_TOOL_NAMES.every((name: any) => extension.tools.has(name));
	const hasCommands = RECON_COMMAND_NAMES.every((name: any) => extension.commands.has(name));
	return hasTools && hasCommands;
}

function isLegacyReconExtension(extension: Extension): boolean {
	if (extension.path.startsWith("<inline:")) return false;
	return /(^|[/\\])reverse-pentest-core\.ts$/.test(extension.path) || hasReconSignature(extension);
}

export function hasGoalModeSignature(extension: Extension): boolean {
	return extension.commands.has("goal") && extension.tools.has("goal_complete");
}

export function isExternalGoalModeExtension(extension: Extension): boolean {
	if (extension.path.startsWith("<inline:")) return false;
	return hasGoalModeSignature(extension);
}

export function suppressLegacyReconConflicts(base: LoadExtensionsResult): LoadExtensionsResult {
	const inlineRecon = base.extensions.find(
		(extension) => extension.path.startsWith("<inline:") && hasReconSignature(extension),
	);
	if (!inlineRecon) return base;

	const suppressedPaths = new Set(
		base.extensions.filter(isLegacyReconExtension).map((extension: any) => extension.path),
	);
	if (hasGoalModeSignature(inlineRecon)) {
		for (const extension of base.extensions.filter(isExternalGoalModeExtension)) suppressedPaths.add(extension.path);
	}
	if (suppressedPaths.size === 0) return base;

	return {
		...base,
		extensions: base.extensions.filter((extension: any) => !suppressedPaths.has(extension.path)),
		errors: base.errors.filter((error: any) => {
			if (suppressedPaths.has(error.path)) return false;
			if (error.path !== inlineRecon.path) return true;
			return !Array.from(suppressedPaths).some((suppressedPath: any) =>
				error.error.includes(`conflicts with ${suppressedPath}`),
			);
		}),
	};
}
