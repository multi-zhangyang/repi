/** Web authz state artifact write. */
/** Reverse I/O authz: run/write/output. */
/** Reverse I/O domain: authz. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import {
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseStructuredSummaryMarkdown,
} from "../reverse-evidence.ts";
import { evidenceWebAuthzDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatWebAuthzState, type WebAuthzStateArtifact } from "../web-runtime.ts";
import { appendEvidence, reverseEvidenceLedgerFields, updateMissionCheckpoint } from "./shared.ts";

export function writeWebAuthzStateArtifact(authz: WebAuthzStateArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceWebAuthzDir(),
		`${authz.timestamp.replace(/[:.]/g, "-")}-${slug(authz.url ?? authz.target ?? "web-authz")}-${authz.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Web Authz State Artifact",
			"",
			formatWebAuthzState(authz, path),
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(authz.structuredSummary, authz.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(authz, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: authz.mode === "run" ? "runtime" : "artifact",
		title: `web-authz-state-${authz.mode} ${authz.url ?? authz.target ?? "no-url"}`,
		fact: reverseEvidenceFactLine(`web-authz-state-${authz.mode}`, authz.structuredSummary, [
			...reverseEvidenceLedgerFields(authz.structuredSummary).factExtra,
			...[
				`url=${authz.url ?? "<missing>"}`,
				`executions=${authz.executions.length}`,
				`anchors=${authz.runtimeAnchors.length}`,
			],
		]),
		command: `re_web_authz_state ${authz.mode}${authz.url ? ` ${authz.url}` : ""}`,
		path,
		verify: `cat ${path}`,
		confidence: reverseEvidenceConfidence("web/API authz state machine runtime capture", authz.structuredSummary),
		query: reverseEvidenceLedgerFields(authz.structuredSummary).query,
		meta: reverseEvidenceLedgerFields(authz.structuredSummary).meta,
	});
	const blocked =
		authz.mode === "run" &&
		authz.executions.length > 0 &&
		authz.executions.every((item: any) => item.status === "blocked");
	updateMissionCheckpoint("web_authz_ready", blocked ? "blocked" : "done", path);
	return path;
}
