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

/**
 * Suppress legacy reverse-pentest-core clones and third-party goal extensions
 * (e.g. @narumitw/pi-goal) when REPI built-in goal mode is present.
 *
 * Built-in goal may live on a separate <inline:*> factory from the recon
 * surface; do not require goal tools to be on the recon extension.
 */
export function suppressLegacyReconConflicts(base: LoadExtensionsResult): LoadExtensionsResult {
	const inlineExtensions = base.extensions.filter((extension) => extension.path.startsWith("<inline:"));
	const inlineRecon = inlineExtensions.find((extension) => hasReconSignature(extension));
	const hasBuiltInGoal = inlineExtensions.some((extension) => hasGoalModeSignature(extension));
	if (!inlineRecon && !hasBuiltInGoal) return base;

	const suppressedPaths = new Set(
		base.extensions.filter(isLegacyReconExtension).map((extension: any) => extension.path),
	);
	if (hasBuiltInGoal) {
		for (const extension of base.extensions.filter(isExternalGoalModeExtension)) {
			suppressedPaths.add(extension.path);
		}
	}
	if (suppressedPaths.size === 0) return base;

	// Prefer built-in inline owners when attributing conflict error filtering.
	const conflictOwnerPath =
		inlineExtensions.find((extension) => hasGoalModeSignature(extension))?.path ?? inlineRecon?.path ?? "";

	return {
		...base,
		extensions: base.extensions.filter((extension: any) => !suppressedPaths.has(extension.path)),
		errors: base.errors.filter((error: any) => {
			if (suppressedPaths.has(error.path)) return false;
			// Drop tool/command conflict diagnostics that name a suppressed extension.
			if (
				Array.from(suppressedPaths).some(
					(suppressedPath: any) =>
						typeof error.error === "string" && error.error.includes(`conflicts with ${suppressedPath}`),
				)
			) {
				return false;
			}
			if (conflictOwnerPath && error.path === conflictOwnerPath) {
				return !Array.from(suppressedPaths).some((suppressedPath: any) =>
					error.error.includes(`conflicts with ${suppressedPath}`),
				);
			}
			return true;
		}),
	};
}
