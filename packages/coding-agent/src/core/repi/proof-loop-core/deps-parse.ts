/** Proof-loop deps passthroughs: parse. */
import { d } from "./deps-core.ts";

export function parseAttackGraphArtifact(...args: any[]): any {
	return d().parseAttackGraphArtifact(...args);
}

export function parseAutofixArtifact(...args: any[]): any {
	return d().parseAutofixArtifact(...args);
}

export function parseCompilerArtifact(...args: any[]): any {
	return d().parseCompilerArtifact(...args);
}

export function parseReplayArtifact(...args: any[]): any {
	return d().parseReplayArtifact(...args);
}

export function parseVerifierArtifact(...args: any[]): any {
	return d().parseVerifierArtifact(...args);
}
