/** Memory path helpers. */
import { memoryPath } from "./memory-core.ts";

export function memoryUsefulnessEvalReportPath(): string {
	return memoryPath("usefulness-eval.json");
}

export function memoryFeedbackClosureReportPath(): string {
	return memoryPath("feedback-closure-report.json");
}

export function memoryScopeIsolationReportPath(): string {
	return memoryPath("scope-isolation-report.json");
}

export function memoryArtifactScopeFilterReportPath(): string {
	return memoryPath("artifact-scope-filter-report.json");
}

export function memoryOrchestratorReportPath(): string {
	return memoryPath("orchestrator-report.json");
}

export function memoryDepositionEventBusPath(): string {
	return memoryPath("deposition-events.jsonl");
}

export function memoryDepositionReportPath(): string {
	return memoryPath("deposition-report.json");
}
