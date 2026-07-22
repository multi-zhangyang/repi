import type { KernelRuntimeDeps } from "./types.ts";

let kernelRuntimeDeps: KernelRuntimeDeps | null = null;

export function configureKernelRuntime(deps: KernelRuntimeDeps): void {
	kernelRuntimeDeps = deps;
}

export function getKernelRuntimeDeps(): KernelRuntimeDeps {
	if (!kernelRuntimeDeps) {
		throw new Error("KernelRuntimeDeps not configured; call configureKernelRuntime() first");
	}
	return kernelRuntimeDeps;
}

/** Short accessor used by kernel criteria/artifact modules. */
export function d(): KernelRuntimeDeps {
	return getKernelRuntimeDeps();
}
