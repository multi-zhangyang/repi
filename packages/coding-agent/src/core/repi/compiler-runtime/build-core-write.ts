/** Compiler artifact write. */
/** Compiler build/write/output with reverse domain next. */

import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { evidenceCompilersDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatCompiler } from "./build-format-paths.ts";
import { d } from "./deps.ts";
import type { CompilerArtifact } from "./types.ts";

export function writeCompilerArtifact(compiler: CompilerArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceCompilersDir(),
		`${compiler.timestamp.replace(/[:.]/g, "-")}-${slug(compiler.route ?? "compiler")}-${compiler.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Compiler Artifact",
			"",
			formatCompiler(compiler, path),
			"",
			"## Final report scaffold",
			"",
			compiler.finalReport.join("\n"),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(compiler, null, 2),
			"```",
			"",
		].join("\n"),
	);
	d().appendEvidence({
		kind: "artifact",
		title: `compiler-${compiler.mode} ${compiler.missionId ?? "no-mission"}`,
		fact: `Compiler ${compiler.mode}: proved=${compiler.statusSummary.proved}, weak=${compiler.statusSummary.weak}, contradicted=${compiler.statusSummary.contradicted}, missing=${compiler.statusSummary.missing}, operator_feedback=${(compiler.operatorFeedback ?? []).length}, strict_claim_check=${compiler.strictClaimCheck?.status ?? "missing"}, claim_check_result=${compiler.claimCheckResult.length}, structured_claim_merge=${compiler.structuredClaimMergeCheck?.status ?? "missing"}`,
		command: `re_compiler ${compiler.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "verifier-to-report compiler",
	});
	d().updateMissionCheckpoint("compiler_ready", "done", path);
	if (compiler.mode === "final" && !compiler.reportPath) {
		d().updateMissionCheckpoint(
			"report_or_writeup_ready",
			"blocked",
			`strict_claim_check=${compiler.strictClaimCheck?.status ?? "missing"} marker=${compiler.strictClaimCheck?.markerPath ?? "missing"}`,
		);
	}
	return path;
}
