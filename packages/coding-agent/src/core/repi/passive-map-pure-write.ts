/** Passive map artifact write + evidence append. */
import { join } from "node:path";
import type { EvidenceRecord } from "./evidence.ts";
import { appendEvidenceRecord } from "./evidence.ts";
import type { PassiveMapExecResult } from "./passive-map-pure-script.ts";
import {
	appendPrivateTextFile,
	ensureRepiStorage,
	evidenceLedgerPath,
	evidenceMapsDir,
	writePrivateTextFile,
} from "./storage.ts";
import { slug } from "./text.ts";

export type PassiveMapSideEffects = {
	/** Mark mission checkpoint after map write. */
	onMapped?: (artifactPath: string) => void;
	/** Optional evidence append override (defaults to ledger append). */
	appendEvidence?: (record: Omit<EvidenceRecord, "timestamp" | "priority"> & { priority?: number }) => EvidenceRecord;
};

export function writePassiveMapArtifact(params: {
	target?: string;
	depth: number;
	script: string;
	result: PassiveMapExecResult;
	signals: string[];
}): string {
	ensureRepiStorage();
	const timestamp = new Date().toISOString();
	const path = join(evidenceMapsDir(), `${timestamp.replace(/[:.]/g, "-")}-${slug(params.target ?? "workspace")}.md`);
	writePrivateTextFile(
		path,
		[
			"# REPI Passive Map Artifact",
			"",
			`timestamp: ${timestamp}`,
			`target: ${params.target ?? "."}`,
			`depth: ${params.depth}`,
			`exit: ${params.result.code}`,
			`killed: ${params.result.killed ? "true" : "false"}`,
			"",
			"## Signals",
			"",
			...(params.signals.length > 0
				? params.signals.map((signal: any) => `- ${signal}`)
				: ["- no high-signal anchors parsed"]),
			"",
			"## Script",
			"",
			"```bash",
			params.script,
			"```",
			"",
			"## stdout",
			"",
			"```",
			params.result.stdout,
			"```",
			"",
			"## stderr",
			"",
			"```",
			params.result.stderr,
			"```",
			"",
		].join("\n"),
	);
	return path;
}

export function defaultAppendEvidence(
	record: Omit<EvidenceRecord, "timestamp" | "priority"> & { priority?: number },
): EvidenceRecord {
	return appendEvidenceRecord(record, {
		ensureStorage: ensureRepiStorage,
		appendText: (path, text) => {
			if (path === evidenceLedgerPath()) appendPrivateTextFile(path, text);
			else appendPrivateTextFile(path, text);
		},
	});
}
