/** Install REPI session hooks (agent lifecycle). */
import { createHash } from "node:crypto";
import { registerRepiAgentHooks } from "./agent-hooks.ts";
import { registerRepiCompactHooks } from "./compact-hooks.ts";
import { _hookDeps } from "./loaders.ts";
import { registerRepiToolHooks } from "./tool-hooks.ts";

export function installRepiSessionHooks(pi: any, stats: any, overrides: Record<string, any> = {}): void {
	const o = overrides;
	const pick = <T>(name: string, fallback: T): T => (name in o ? (o[name] as T) : fallback);
	const d: Record<string, any> = {};
	for (const [name, fallback] of Object.entries(_hookDeps)) {
		d[name] = pick(name, fallback);
	}
	// expose createHash to tool hooks via deps bag
	d.createHash = createHash;

	const compactState = {
		compactAutoResumeBudget: 2,
		compactAutoResumeIds: new Set<string>(),
	};

	registerRepiAgentHooks(pi, stats, d);
	registerRepiToolHooks(pi, stats, d);
	registerRepiCompactHooks(pi, stats, d, compactState);
}
