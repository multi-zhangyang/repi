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
	const base = `${native.timestamp.replace(/[:.]/g, "-")}-${slug(native.target ?? "native-runtime")}-${native.mode}`;
	const dir = evidenceNativeRuntimeDir();
	const path = join(dir, `${base}.md`);
	const scriptPath = join(dir, `${base}.capture.sh`);
	const script = String(native.captureScript ?? "");
	if (script) writePrivateTextFile(scriptPath, script.endsWith("\n") ? script : `${script}\n`);
	// Disk JSON omits multi-10k capture script body (sidecar .capture.sh keeps full script).
	const leanNative = {
		...native,
		captureScript: script ? `# see ${scriptPath} chars=${script.length}` : native.captureScript,
		runtimeAnchors: (native.runtimeAnchors ?? []).slice(0, 120),
		executions: (native.executions ?? []).map((item: any) => ({
			...item,
			stdoutHead: typeof item.stdoutHead === "string" ? item.stdoutHead.slice(0, 2000) : item.stdoutHead,
			stderrHead: typeof item.stderrHead === "string" ? item.stderrHead.slice(0, 1200) : item.stderrHead,
		})),
	};
	writePrivateTextFile(
		path,
		[
			"# REPI Native Runtime Artifact",
			"",
			formatNativeRuntime(native, path),
			"",
			script ? `capture_script_file: ${scriptPath}` : undefined,
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(native.structuredSummary, native.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(leanNative, null, 2),
			"```",
			"",
		]
			.filter((line) => line !== undefined)
			.join("\n"),
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
	if (!blocked) {
		try {
			updateMissionCheckpoint("reverse_proof_exit_ready", "pending", `runtime_adapter native ${path}`);
			updateMissionCheckpoint("minimal_path_proven", "pending", `runtime_adapter native ${path}`);
		} catch {
			/* optional */
		}
	}
	return path;
}
