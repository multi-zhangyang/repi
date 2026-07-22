/** Case-memory lane plan helpers (product-lean). */

export { applyCaseMemoryLanePlan } from "./case-memory-apply.ts";
export type { CaseMemoryDeps } from "./case-memory-deps.ts";
export { configureCaseMemory } from "./case-memory-deps.ts";
export {
	caseMemoryAutoNext,
	caseMemoryMigrationScore,
	caseMemoryProofLaneIndex,
	formatCaseMemoryLanePlan,
} from "./case-memory-plan.ts";

export function readCaseMemoryRows(..._args: any[]): any[] {
	return [];
}
export function latestCaseMemoryBySignature(..._args: any[]): any {
	return undefined;
}
