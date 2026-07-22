/** Write swarm run/merge memory boards. */

import { memoryPath, writePrivateTextFile } from "../../storage.ts";
import type { SwarmArtifact } from "../types.ts";

export function writeSwarmModeBoards(swarm: SwarmArtifact, path: string): void {
	if (swarm.mode === "run") {
		writePrivateTextFile(
			memoryPath("swarm-run-board.md"),
			[
				"# REPI Swarm Run Board",
				"",
				`Updated: ${swarm.timestamp}`,
				`Artifact: ${path}`,
				"",
				"## Worker results",
				...(swarm.workerResults.length ? swarm.workerResults.map((item: any) => `- ${item}`) : ["- none"]),
				"",
				"## Merge digest",
				...(swarm.mergeDigest.length ? swarm.mergeDigest.map((item: any) => `- ${item}`) : ["- none"]),
				"",
				"## Execution audit",
				...(swarm.executionAudit.length ? swarm.executionAudit.map((item: any) => `- ${item}`) : ["- none"]),
				"",
				"## Retry queue",
				...(swarm.retryQueue.length ? swarm.retryQueue.map((item: any) => `- ${item}`) : ["- none"]),
				"",
			].join("\n"),
		);
	}
	if (swarm.mode === "merge") {
		writePrivateTextFile(
			memoryPath("swarm-board.md"),
			[
				"# REPI Swarm Board",
				"",
				`Updated: ${swarm.timestamp}`,
				`Artifact: ${path}`,
				"",
				"## Handoff digest",
				...swarm.handoffDigest.map((item: any) => `- ${item}`),
				"",
				"## Merge protocol",
				...swarm.mergeProtocol.map((item: any) => `- ${item}`),
				"",
				"## Coverage matrix",
				...(swarm.coverageMatrix.length ? swarm.coverageMatrix.map((item: any) => `- ${item}`) : ["- none"]),
				"",
			].join("\n"),
		);
	}
}
