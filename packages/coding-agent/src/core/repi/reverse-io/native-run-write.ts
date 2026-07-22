/** Native runtime artifact write. */
/** Reverse I/O native: run/write/output. */

/** Reverse I/O domain: native. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import {
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseStructuredSummaryMarkdown,
} from "../reverse-evidence.ts";
import { formatNativeRuntime, type NativeRuntimeArtifact } from "../reverse-runtime.ts";
import { evidenceNativeRuntimeDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvidence, reverseEvidenceLedgerFields, updateMissionCheckpoint } from "./shared.ts";

export function writeNativeRuntimeArtifact(native: NativeRuntimeArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceNativeRuntimeDir(),
		`${native.timestamp.replace(/[:.]/g, "-")}-${slug(native.target ?? "native-runtime")}-${native.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Native Runtime Artifact",
			"",
			formatNativeRuntime(native, path),
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(native.structuredSummary, native.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(native, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: native.mode === "run" ? "runtime" : "artifact",
		title: `native-runtime-${native.mode} ${native.target ?? "no-target"}`,
		fact: reverseEvidenceFactLine(`native-runtime-${native.mode}`, native.structuredSummary, [
			...reverseEvidenceLedgerFields(native.structuredSummary).factExtra,
			...[
				`target=${native.target ?? "<missing>"}`,
				`executions=${native.executions.length}`,
				`anchors=${native.runtimeAnchors.length}`,
			],
		]),
		command: `re_native_runtime ${native.mode}${native.target ? ` ${native.target}` : ""}`,
		path,
		verify: `cat ${path}`,
		confidence: reverseEvidenceConfidence("native ELF/GDB/pwn runtime capture", native.structuredSummary),
		query: reverseEvidenceLedgerFields(native.structuredSummary).query,
		meta: reverseEvidenceLedgerFields(native.structuredSummary).meta,
	});
	const blocked =
		native.mode === "run" &&
		native.executions.length > 0 &&
		native.executions.every((item: any) => item.status === "blocked");
	updateMissionCheckpoint("native_runtime_ready", blocked ? "blocked" : "done", path);
	return path;
}
