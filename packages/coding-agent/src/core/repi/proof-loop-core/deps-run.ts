/** Proof-loop deps passthroughs: run. */
import { d } from "./deps-core.ts";

export function appendMemoryEvent(...args: any[]): any {
	return d().appendMemoryEvent(...args);
}

export function appendRuntimeFailureInputs(...args: any[]): any {
	return d().appendRuntimeFailureInputs(...args);
}

export function artifactTargetMatches(...args: any[]): any {
	return d().artifactTargetMatches(...args);
}

export function autonomousExecutionBudget(...args: any[]): any {
	return d().autonomousExecutionBudget(...args);
}

export function operatorCommandConcrete(...args: any[]): any {
	return d().operatorCommandConcrete(...args);
}

export function operatorFeedbackDispatcherCommands(...args: any[]): any {
	return d().operatorFeedbackDispatcherCommands(...args);
}

export function operatorStepPriority(...args: any[]): any {
	return d().operatorStepPriority(...args);
}

export function runAutopilot(...args: any[]): any {
	return d().runAutopilot(...args);
}

export function runReplayer(...args: any[]): any {
	return d().runReplayer(...args);
}

export function runtimeAdapterMitigationEvidenceForGraph(...args: any[]): any {
	return d().runtimeAdapterMitigationEvidenceForGraph(...args);
}

export function runtimeAdapterParserSummaryForGraph(...args: any[]): any {
	return d().runtimeAdapterParserSummaryForGraph(...args);
}

export function runtimeFailureCategory(...args: any[]): any {
	return d().runtimeFailureCategory(...args);
}

export function runtimeFailureCommandTarget(...args: any[]): any {
	return d().runtimeFailureCommandTarget(...args);
}
