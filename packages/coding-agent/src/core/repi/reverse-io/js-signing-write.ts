/** JS signing artifact write with reverse evidence ledger. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import {
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseStructuredSummaryMarkdown,
} from "../reverse-evidence.ts";
import { evidenceJsSigningDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatJsSigning, type JsSigningArtifact } from "../web-runtime/js-signing.ts";
import { appendEvidence, reverseEvidenceLedgerFields, updateMissionCheckpoint } from "./shared.ts";

export function writeJsSigningArtifact(artifact: JsSigningArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceJsSigningDir(),
		`${artifact.timestamp.replace(/[:.]/g, "-")}-${slug(artifact.target ?? artifact.url ?? "js-signing")}-${artifact.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI JS Signing Artifact",
			"",
			formatJsSigning(artifact, path),
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(artifact.structuredSummary, artifact.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(artifact, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: artifact.mode === "run" ? "runtime" : "artifact",
		title: `js-signing-${artifact.mode} ${artifact.target ?? "no-target"}`,
		fact: reverseEvidenceFactLine(`js-signing-${artifact.mode}`, artifact.structuredSummary, [
			...reverseEvidenceLedgerFields(artifact.structuredSummary).factExtra,
			`target=${artifact.target ?? "<missing>"}`,
			`executions=${artifact.executions.length}`,
			`anchors=${artifact.runtimeAnchors.length}`,
		]),
		command: `re_js_signing ${artifact.mode}${artifact.target ? ` ${artifact.target}` : ""}`,
		path,
		verify: `cat ${path}`,
		confidence: reverseEvidenceConfidence("JS signing hook/rebuild runtime capture", artifact.structuredSummary),
		query: reverseEvidenceLedgerFields(artifact.structuredSummary).query,
		meta: reverseEvidenceLedgerFields(artifact.structuredSummary).meta,
	});
	const blocked =
		artifact.mode === "run" &&
		artifact.executions.length > 0 &&
		artifact.executions.every((item: any) => item.status === "blocked");
	updateMissionCheckpoint("js_signing_ready", blocked ? "blocked" : "done", path);
	return path;
}
