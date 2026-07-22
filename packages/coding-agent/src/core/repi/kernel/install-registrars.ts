/**
 * REPI tool/command install assembly (lean product surface registrars).
 * Lean deps are static; full-surface narrative deps load via createRequire.
 */

import { createRequire } from "node:module";
import type { ExtensionAPI } from "../../extensions/types.ts";
import { registerRepiControlPlaneCommands, registerRepiControlPlaneTools } from "./install-control-tools.ts";
import { registerRepiNarrativeCommands, registerRepiNarrativeTools } from "./install-narrative-tools.ts";
import { registerRepiProofLoopCommands, registerRepiProofLoopTools } from "./install-proof-tools.ts";
import { repiInstallBaseDeps } from "./install-registrars-base-deps.ts";
import {
	registerRepiReverseRuntimeCommands,
	registerRepiReverseRuntimeTools,
	registerRepiTechniqueTool,
} from "./install-reverse-tools.ts";
import { createRepiCommandRegistrar, createRepiToolRegistrar } from "./install-surface.ts";
import { isRepiFullSurface } from "./lean-surface.ts";

const requireRepiModule = createRequire(import.meta.url);
const _baseDeps = repiInstallBaseDeps;

function loadNarrativeInstallDeps(): Record<string, any> {
	try {
		return (
			requireRepiModule("./install-narrative-deps.ts") as {
				getRepiNarrativeInstallDeps: () => Record<string, any>;
			}
		).getRepiNarrativeInstallDeps();
	} catch {
		return (
			requireRepiModule("./install-narrative-deps.js") as {
				getRepiNarrativeInstallDeps: () => Record<string, any>;
			}
		).getRepiNarrativeInstallDeps();
	}
}

function mergeDeps(overrides: Record<string, any> = {}, opts: { fullSurface?: boolean } = {}): Record<string, any> {
	const full = opts.fullSurface ?? isRepiFullSurface();
	const narrative = full ? loadNarrativeInstallDeps() : {};
	return { ..._baseDeps, ...narrative, ...overrides };
}

export function installReconTools(pi: ExtensionAPI, overrides: Record<string, any> = {}): void {
	const fullSurface = isRepiFullSurface();
	const deps = mergeDeps(overrides, { fullSurface });
	const registerTool = createRepiToolRegistrar(pi);
	registerRepiTechniqueTool(registerTool);
	registerRepiReverseRuntimeTools(registerTool, pi, deps as any);
	registerRepiProofLoopTools(registerTool, pi, deps as any);
	registerRepiControlPlaneTools(registerTool, pi, deps as any);
	if (fullSurface) {
		registerRepiNarrativeTools(registerTool, pi, deps as any);
	}
}

export function installReconCommands(pi: ExtensionAPI, stats: any, overrides: Record<string, any> = {}): void {
	const fullSurface = isRepiFullSurface();
	const deps = mergeDeps(overrides, { fullSurface });
	const registerCommand = createRepiCommandRegistrar(pi);
	registerRepiReverseRuntimeCommands(registerCommand, pi, deps as any);
	registerRepiProofLoopCommands(registerCommand, pi, deps as any);
	registerRepiControlPlaneCommands(registerCommand, pi, deps as any);
	if (fullSurface) {
		registerRepiNarrativeCommands(registerCommand, pi, deps as any);
	}
	void stats;
}
