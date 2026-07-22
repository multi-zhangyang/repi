/** Context-pack / kernel / decision lazy loaders for factory hooks. */
import { requireRepiModule } from "./loaders-require.ts";

function loadContextPack(): Record<string, any> {
	try {
		return requireRepiModule("../context-pack.ts") as Record<string, any>;
	} catch {
		return requireRepiModule("../context-pack.js") as Record<string, any>;
	}
}
export function buildContextPack(...args: any[]): any {
	return loadContextPack().buildContextPack(...args);
}
export function writeContextPackArtifact(...args: any[]): any {
	return loadContextPack().writeContextPackArtifact(...args);
}
export function buildContextEvidenceTail(...args: any[]): any {
	try {
		const mod = requireRepiModule("../pentesting-task-tree.ts") as { buildContextEvidenceTail: (...a: any[]) => any };
		return mod.buildContextEvidenceTail(...args);
	} catch {
		const mod = requireRepiModule("../pentesting-task-tree.js") as { buildContextEvidenceTail: (...a: any[]) => any };
		return mod.buildContextEvidenceTail(...args);
	}
}
export function buildKernelOutput(...args: any[]): string {
	try {
		const mod = requireRepiModule("../kernel-runtime.ts") as { buildKernelOutput: (...a: any[]) => string };
		return mod.buildKernelOutput(...args);
	} catch {
		const mod = requireRepiModule("../kernel-runtime.js") as { buildKernelOutput: (...a: any[]) => string };
		return mod.buildKernelOutput(...args);
	}
}
export function buildDecisionCoreOutput(...args: any[]): string {
	try {
		const mod = requireRepiModule("../decision-runtime.ts") as { buildDecisionCoreOutput: (...a: any[]) => string };
		return mod.buildDecisionCoreOutput(...args);
	} catch {
		const mod = requireRepiModule("../decision-runtime.js") as { buildDecisionCoreOutput: (...a: any[]) => string };
		return mod.buildDecisionCoreOutput(...args);
	}
}
