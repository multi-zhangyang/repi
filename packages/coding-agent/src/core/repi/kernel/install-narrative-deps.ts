/**
 * Full-surface install deps (narrative + kernel/decision).
 * Loaded only when isRepiFullSurface() so lean product starts skip this graph.
 */
import { narrativeInstallDepsBag } from "./install-narrative-deps-imports.ts";

export function getRepiNarrativeInstallDeps(): Record<string, any> {
	return { ...narrativeInstallDepsBag };
}
