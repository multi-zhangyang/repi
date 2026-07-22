/** Replayer runtime DI deps and compiler lookup. */

import type { CompilerArtifact } from "../compiler-runtime.ts";
import {
	buildCompiler,
	latestCompilerArtifactPath,
	parseCompilerArtifact,
	writeCompilerArtifact,
} from "../compiler-runtime.ts";

export type ReplayerRuntimeDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	artifactTargetMatches?: (...args: any[]) => any;
};

let replayerRuntimeDeps: ReplayerRuntimeDeps | null = null;

export function configureReplayerRuntime(deps: ReplayerRuntimeDeps): void {
	replayerRuntimeDeps = deps;
}

function d(): ReplayerRuntimeDeps {
	if (!replayerRuntimeDeps)
		throw new Error("replayer-runtime not configured; call configureReplayerRuntime() from REPI kernel init");
	return replayerRuntimeDeps;
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}

export function artifactTargetMatches(target: string | undefined, candidate: string | undefined): boolean {
	if (d().artifactTargetMatches) return d().artifactTargetMatches!(target, candidate);
	if (!target) return true;
	if (!candidate) return false;
	return (
		candidate.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(candidate.toLowerCase())
	);
}

export function latestOrBuildCompiler(options: { target?: string } = {}): { compiler: CompilerArtifact; path: string } {
	const latest = latestCompilerArtifactPath(
		options.target ? { target: options.target, requestedBy: "latest_or_build_compiler" } : {},
	);
	if (latest) {
		const compiler = parseCompilerArtifact(latest);
		if (compiler && artifactTargetMatches(options.target, compiler.target)) return { compiler, path: latest };
	}
	const compiler = buildCompiler({ target: options.target, mode: "draft" });
	const path = writeCompilerArtifact(compiler);
	return { compiler, path };
}
