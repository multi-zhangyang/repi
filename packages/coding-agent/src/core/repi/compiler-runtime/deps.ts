import type { CompilerRuntimeDeps } from "./types.ts";

let compilerRuntimeDeps: CompilerRuntimeDeps | null = null;

export function configureCompilerRuntime(deps: CompilerRuntimeDeps): void {
	compilerRuntimeDeps = deps;
}

export function d(): CompilerRuntimeDeps {
	if (!compilerRuntimeDeps) throw new Error("compiler-runtime not configured; call configureCompilerRuntime() first");
	return compilerRuntimeDeps;
}
