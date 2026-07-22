/** Failure-repair DI configure/shims. */
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
	return d().operatorFeedbackCategory(...args);
}

export function operatorFeedbackFallbackCommands(...args: any[]): any {
	return d().operatorFeedbackFallbackCommands(...args);
}

export function runtimeArtifactHashes(...args: any[]): any {
	return d().runtimeArtifactHashes(...args);
}
