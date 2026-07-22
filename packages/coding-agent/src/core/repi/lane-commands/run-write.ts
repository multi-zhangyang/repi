/** Lane run artifact write. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { evidenceRunsDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatLaneRunArtifactMarkdown } from "./run-write-markdown.ts";
import type { LaneCommand, LaneCommandPack } from "./types.ts";

type LaneRunAnalysis = any;

export function writeLaneRunArtifact(params: {
	pack: LaneCommandPack;
	runnable: LaneCommand[];
	script: string;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	analysis: LaneRunAnalysis;
}): string {
	ensureReconStorage();
	const timestamp = new Date().toISOString();
	const path = join(evidenceRunsDir(), `${timestamp.replace(/[:.]/g, "-")}-${slug(params.pack.lane)}.md`);
	writePrivateTextFile(
		path,
		formatLaneRunArtifactMarkdown({
			timestamp,
			pack: params.pack,
			runnable: params.runnable,
			script: params.script,
			result: params.result,
			analysis: params.analysis,
		}),
	);
	return path;
}
