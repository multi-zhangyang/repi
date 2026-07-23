/** Mobile runtime artifact write. */
/** Reverse I/O mobile: run/write/output. */
/** Reverse I/O domain: mobile. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import {
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseStructuredSummaryMarkdown,
} from "../reverse-evidence.ts";
import { formatMobileRuntime, type MobileRuntimeArtifact } from "../reverse-runtime.ts";
import { evidenceMobileRuntimeDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvidence, reverseEvidenceLedgerFields, updateMissionCheckpoint } from "./shared.ts";

export function writeMobileRuntimeArtifact(mobile: MobileRuntimeArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceMobileRuntimeDir(),
		`${mobile.timestamp.replace(/[:.]/g, "-")}-${slug(mobile.packageName ?? mobile.target ?? "mobile-runtime")}-${mobile.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Mobile Runtime Artifact",
			"",
			formatMobileRuntime(mobile, path),
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(mobile.structuredSummary, mobile.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(mobile, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: mobile.mode === "run" ? "runtime" : "artifact",
		title: `mobile-runtime-${mobile.mode} ${mobile.packageName ?? mobile.target ?? "no-target"}`,
		fact: reverseEvidenceFactLine(`mobile-runtime-${mobile.mode}`, mobile.structuredSummary, [
			...reverseEvidenceLedgerFields(mobile.structuredSummary).factExtra,
			...[
				`target=${mobile.target ?? "<missing>"}`,
				`package=${mobile.packageName ?? "<missing>"}`,
				`executions=${mobile.executions.length}`,
				`anchors=${mobile.runtimeAnchors.length}`,
			],
		]),
		command: `re_mobile_runtime ${mobile.mode}${mobile.target ? ` ${mobile.target}` : ""}${mobile.packageName ? ` ${mobile.packageName}` : ""}`,
		path,
		verify: `cat ${path}`,
		confidence: reverseEvidenceConfidence("mobile APK/ADB/Frida/GDB runtime capture", mobile.structuredSummary),
		query: reverseEvidenceLedgerFields(mobile.structuredSummary).query,
		meta: reverseEvidenceLedgerFields(mobile.structuredSummary).meta,
	});
	const blocked =
		mobile.mode === "run" &&
		mobile.executions.length > 0 &&
		mobile.executions.every((item: any) => item.status === "blocked");
	updateMissionCheckpoint("mobile_runtime_ready", blocked ? "blocked" : "done", path);
	if (!blocked) {
		try {
			updateMissionCheckpoint("reverse_proof_exit_ready", "pending", `runtime_adapter mobile ${path}`);
			updateMissionCheckpoint("minimal_path_proven", "pending", `runtime_adapter mobile ${path}`);
		} catch {
			/* optional */
		}
	}
	return path;
}
