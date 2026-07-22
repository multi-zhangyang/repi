/** Context-pack artifact entry helpers. */
import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import type { ArtifactScopeFilterDecisionV1 } from "../artifact-scope.ts";
import { memoryArtifactScopeFilterReportPath } from "../storage.ts";
import { contextEvidenceRank } from "../swarm-claim-ledger/pure.ts";
import { hashFileSha256 } from "../text.ts";
import type { ContextArtifactIndexEntry } from "./types.ts";

export function contextSourceCommand(kind: string): string {
	if (
		/^memory_(?:events|case_memory|retrieval|store|snapshot|usefulness|quality|feedback|scope|orchestrator|deposition|vector|distillation|quarantine|semantic|contradiction|injection|sedimentation|supervisor|lifecycle|active)/i.test(
			kind,
		)
	) {
		if (/store_report/i.test(kind)) return "re_evidence digest";
		if (/store_snapshot/i.test(kind)) return "re_evidence digest";
		if (/usefulness/i.test(kind)) return "re_complete audit";
		if (/quality/i.test(kind)) return "re_complete audit";
		if (/active/i.test(kind)) return "re_note list";
		if (/feedback/i.test(kind)) return "re_note list";
		if (/scope/i.test(kind)) return "re_mission show";
		if (/orchestrator/i.test(kind)) return "re_mission show";
		if (/deposition/i.test(kind)) return "re_evidence digest";
		if (/compact_resume|compaction_resume/i.test(kind)) return "re_context pack";
		if (/vector/i.test(kind)) return "re_knowledge_graph build";
		if (/distillation|quarantine/i.test(kind)) return "re_note list";
		if (/semantic|contradiction|injection|sedimentation/i.test(kind)) return "re_evidence digest";
		if (/supervisor|lifecycle/i.test(kind)) return "re_complete audit";
		return "re_evidence digest";
	}
	if (
		/native_runtime|exploit_lab|mobile_runtime|browser|web_authz|js_signing|proof_loop|attack_graph|exploit_chain/i.test(
			kind,
		)
	) {
		if (/native_runtime/i.test(kind)) return "re_native_runtime run <binary>";
		if (/exploit_lab/i.test(kind)) return "re_exploit_lab run <target> 5";
		if (/mobile_runtime/i.test(kind)) return "re_mobile_runtime run <package>";
		if (/browser/i.test(kind)) return "re_live_browser run <url>";
		if (/web_authz/i.test(kind)) return "re_web_authz_state run <url>";
		if (/js_signing/i.test(kind)) return "re_js_signing run <url-or-bundle>";
		if (/proof_loop/i.test(kind)) return "re_proof_loop run <target> 4 2";
		if (/attack_graph/i.test(kind)) return "re_attack_graph show";
		if (/exploit_chain/i.test(kind)) return "re_exploit_chain show";
		return "re_domain_proof_exit show";
	}
	return `re_${kind.replace(/-/g, "_")} show`;
}

export function contextArtifactEntry(
	kind: string,
	path: string,
	scopeDecision?: ArtifactScopeFilterDecisionV1,
): ContextArtifactIndexEntry {
	let exists = false;
	let size = 0;
	let mtime = "";
	let sha: string | null = null;
	try {
		const stat = statSync(path);
		exists = true;
		size = stat.size;
		mtime = stat.mtime.toISOString();
		sha = hashFileSha256(path);
	} catch {
		// keep missing metadata explicit for resume verification
	}
	return {
		kind,
		path,
		artifactId: `${kind}:${createHash("sha256").update(path).digest("hex").slice(0, 16)}`,
		exists,
		size,
		mtime,
		sha256: sha,
		evidenceRank: contextEvidenceRank(kind),
		sourceCommand: contextSourceCommand(kind),
		scopeVerdict: scopeDecision?.verdict,
		scopeReasons: scopeDecision?.reasons,
		scopeEventId: scopeDecision?.eventId,
		scopeFilterReportPath: scopeDecision?.requestedBy ? memoryArtifactScopeFilterReportPath() : undefined,
	};
}
