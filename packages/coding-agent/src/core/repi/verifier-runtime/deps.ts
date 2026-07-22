/** Verifier-runtime deps bus. */
import type { VerifierRuntimeDeps } from "./types.ts";

let verifierRuntimeDeps: VerifierRuntimeDeps | null = null;

export function configureVerifierRuntime(deps: VerifierRuntimeDeps): void {
	verifierRuntimeDeps = deps;
}

export function d(): VerifierRuntimeDeps {
	if (!verifierRuntimeDeps) throw new Error("verifier-runtime not configured");
	return verifierRuntimeDeps;
}

export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
