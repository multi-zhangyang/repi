/** Optional memory artifact path pairs (product-lean opt-in). */
import { existsSync } from "node:fs";
import {
	compactResumeLedgerV2ReportPath,
	compactResumeTransitionLedgerPath,
	memoryArtifactScopeFilterReportPath,
	memoryScopeIsolationReportPath,
	memoryStatusReportPath,
} from "../storage.ts";

const existingPath = (path: string): string | undefined => (existsSync(path) ? path : undefined);

export function leanContextMemoryPairs(): Array<[string, string | undefined]> {
	return [
		["artifact_scope_filter", existingPath(memoryArtifactScopeFilterReportPath())],
		["memory_scope_isolation", existingPath(memoryScopeIsolationReportPath())],
		["memory_status_report", existingPath(memoryStatusReportPath())],
		["compact_resume_transition_ledger", existingPath(compactResumeTransitionLedgerPath())],
		["compact_resume_ledger_v2_report", existingPath(compactResumeLedgerV2ReportPath())],
	];
}

export const RAW_MEMORY_ARTIFACT_KINDS = new Set([
	"memory_events",
	"memory_case_memory",
	"memory_deposition_events",
	"memory_experience_episodes",
	"memory_experience_claims",
	"memory_experience_promotions",
	"memory_distill_promotion_candidates",
	"memory_quality_ledger",
	"memory_replay_ledger",
	"memory_strategy_capsules",
	"memory_active_injection_pack",
	"memory_maturation_runtime_ledger",
	"memory_vector_index",
	"memory_vector_search",
	"memory_semantic_index",
	"memory_contradiction_ledger",
	"memory_injection_packet",
]);
