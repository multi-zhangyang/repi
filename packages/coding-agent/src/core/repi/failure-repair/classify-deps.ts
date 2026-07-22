/** Failure-repair DI configure/shims. */
import { runtimeArtifactHashes as pureRuntimeArtifactHashes } from "../swarm-claim-ledger/pure.ts";
import type { FailureRepairDeps } from "./types.ts";

let failureRepairDeps: FailureRepairDeps | undefined;

export function configureFailureRepair(deps: FailureRepairDeps): void {
	failureRepairDeps = deps;
}

export function d(): FailureRepairDeps {
	if (!failureRepairDeps)
		throw new Error("failure-repair not configured; call configureFailureRepair() from REPI kernel init");
	return failureRepairDeps;
}

export function latestProofLoopArtifactPath(...args: any[]): any {
	return d().latestProofLoopArtifactPath(...args);
}

export function operatorFeedbackCategory(...args: any[]): any {
	const fn = (d() as any).operatorFeedbackCategory;
	if (typeof fn === "function" && fn !== operatorFeedbackCategory) return fn(...args);
	return undefined;
}

export function operatorFeedbackFallbackCommands(...args: any[]): any {
	const fn = (d() as any).operatorFeedbackFallbackCommands;
	// Avoid DI self-loop when wire mistakenly binds this shim as the implementation.
	if (typeof fn === "function" && fn !== operatorFeedbackFallbackCommands) return fn(...args);
	return [];
}

export function runtimeArtifactHashes(...args: any[]): any {
	const fn = (d() as any).runtimeArtifactHashes;
	if (typeof fn === "function" && fn !== runtimeArtifactHashes) return fn(...args);
	return pureRuntimeArtifactHashes(...(args as [any]));
}
