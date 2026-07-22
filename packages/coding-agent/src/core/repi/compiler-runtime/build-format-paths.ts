/** Compiler format/path helpers. */
import { join } from "node:path";
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { latestScopedMarkdownArtifact } from "../reflection/types-config.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceCompilersDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { d } from "./deps.ts";
import { formatStrictClaimCheckSnapshot } from "./pure-claim.ts";
import type { CompilerArtifact } from "./types.ts";

export function writeCompiledReport(compiler: CompilerArtifact): string {
	ensureReconStorage();
	const safeTitle = slug(`${compiler.route ?? "repi"}-${compiler.mode}-compiled-report`).slice(0, 90);
	const path = join(d().reportDir(), `${compiler.timestamp.replace(/[:.]/g, "-")}-${safeTitle}.md`);
	// Atomic (opt #208): temp+rename 0o600 via writePrivateTextFile — a
	// crash/ENOSPC mid-write cannot leave a truncated compiled-report markdown
	// that a later mission checkpoint reader would load as partial with no
	// signal. Matches the autofix-report atomic write (#203, line ~4498). The
	// previous bare writeFileSync truncated-then-wrote → a torn write lost the
	// compiled report.
	writePrivateTextFile(path, compiler.finalReport.join("\n"));
	d().updateMissionCheckpoint("report_or_writeup_ready", "done", `${path} strict_claim_check=pass`);
	return path;
}

export function formatCompiler(compiler: CompilerArtifact, path?: string): string {
	return [
		"compiler_report:",
		path ? `compiler_artifact: ${path}` : undefined,
		`timestamp: ${compiler.timestamp}`,
		`mode: ${compiler.mode}`,
		`mission_id: ${compiler.missionId ?? "none"}`,
		`route: ${compiler.route ?? "none"}`,
		`target: ${compiler.target ?? "<none>"}`,
		`verifier_artifact: ${compiler.verifierArtifact ?? "none"}`,
		`supervisor_artifact: ${compiler.supervisorArtifact ?? "none"}`,
		`reportpath: ${compiler.reportPath ?? "none"}`,
		`status_summary: proved=${compiler.statusSummary.proved} weak=${compiler.statusSummary.weak} contradicted=${compiler.statusSummary.contradicted} missing=${compiler.statusSummary.missing}`,
		"release_check_metadata:",
		...(compiler.releaseCheckMetadata.length
			? compiler.releaseCheckMetadata.map((item: any) => `- ${item}`)
			: ["- none"]),
		"claim_check_policy:",
		...(compiler.claimCheckPolicy.length ? compiler.claimCheckPolicy.map((item: any) => `- ${item}`) : ["- none"]),
		"strict_claim_check:",
		...formatStrictClaimCheckSnapshot(compiler.strictClaimCheck),
		"claim_check_result:",
		...(compiler.claimCheckResult.length ? compiler.claimCheckResult.map((item: any) => `- ${item}`) : ["- none"]),
		"structured_claim_merge_check:",
		`- status=${compiler.structuredClaimMergeCheck?.status ?? "missing"}`,
		`- path=${compiler.structuredClaimMergeCheck?.mergePath ?? "missing"}`,
		`- final_claims=${compiler.structuredClaimMergeCheck?.finalClaimCount ?? 0}`,
		`- blocked_claims=${compiler.structuredClaimMergeCheck?.blockedClaimCount ?? 0}`,
		...(compiler.structuredClaimMergeCheck?.errors.length
			? compiler.structuredClaimMergeCheck.errors.slice(0, 10).map((item: any) => `- error=${item}`)
			: ["- errors=none"]),
		"operator_feedback:",
		...((compiler.operatorFeedback ?? []).length
			? (compiler.operatorFeedback ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"outcome:",
		...(compiler.outcome.length ? compiler.outcome.map((item: any) => `- ${item}`) : ["- none"]),
		"key_evidence_block:",
		...(compiler.keyEvidence.length ? compiler.keyEvidence.map((item: any) => `- ${item}`) : ["- none"]),
		"repro_commands:",
		...(compiler.reproCommands.length ? compiler.reproCommands.map((item: any) => `- ${item}`) : ["- none"]),
		"contradictions:",
		...(compiler.contradictions.length ? compiler.contradictions.map((item: any) => `- ${item}`) : ["- none"]),
		"gaps:",
		...(compiler.gaps.length ? compiler.gaps.map((item: any) => `- ${item}`) : ["- none"]),
		"next_operator_queue:",
		...(compiler.nextOperatorQueue.length ? compiler.nextOperatorQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"final_report_scaffold:",
		...compiler.finalReport.slice(0, 80),
		`next_compiler_command: ${compiler.mode === "final" ? "re_complete audit" : "re_compiler final"}`,
		"source_artifacts:",
		...(compiler.sourceArtifacts.length ? compiler.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function latestCompilerArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("compiler", evidenceCompilersDir(), options);
}

export function parseCompilerArtifact(path: string): CompilerArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as CompilerArtifact;
	} catch {
		return undefined;
	}
}
