/** Tool-index configuration deps. */
import type { ToolIndexInstallDeps } from "./types.ts";

let toolIndexInstallDeps: ToolIndexInstallDeps | null = null;

export function configureToolIndex(_deps: Record<string, never> = {}): void {}

export function configureToolIndexInstall(deps: ToolIndexInstallDeps): void {
	toolIndexInstallDeps = deps;
}

export function d(): ToolIndexInstallDeps {
	if (!toolIndexInstallDeps) throw new Error("tool-index install not configured");
	return toolIndexInstallDeps;
}

export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
