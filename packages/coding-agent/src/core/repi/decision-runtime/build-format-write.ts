/** Decision-core artifact writer. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import { evidenceDecisionsDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatDecisionCore } from "./build-format-text.ts";
import { appendEvidence, memoryPath, updateMissionCheckpoint } from "./deps.ts";
import type { DecisionCoreArtifact } from "./types.ts";

export function writeDecisionCoreArtifact(decision: DecisionCoreArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceDecisionsDir(),
		`${decision.timestamp.replace(/[:.]/g, "-")}-${slug(decision.route ?? "decision")}-${decision.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Decision Core Artifact",
			"",
			formatDecisionCore(decision, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(decision, null, 2),
			"```",
			"",
		].join("\n"),
	);
	const mem = memoryPath?.("decision-core.md") ?? memoryPath("decision-core.md");
	try {
		writePrivateTextFile(
			String(mem),
			[
				"# REPI Decision Core",
				"",
				`Updated: ${decision.timestamp}`,
				`Artifact: ${path}`,
				"",
				"## Objective stack",
				...decision.objectiveStack.map((item: any) => `- ${item}`),
				"",
				"## Check pressure",
				...decision.checkPressure.map((item: any) => `- ${item}`),
				"",
				"## Operator queue",
				...decision.operatorQueue.map((item: any) => `- ${item}`),
				"",
				"## Executed",
				...(decision.executed.length
					? decision.executed.map((item: any) => `- ${item.stepId} [${item.status}] ${item.command}`)
					: ["- none"]),
				"",
			].join("\n"),
		);
	} catch {
		// memory path optional under lean product
	}
	appendEvidence({
		kind: "artifact",
		title: `decision-core-${decision.mode} ${decision.missionId ?? "no-mission"}`,
		fact: `Decision core ${decision.mode}: objectives=${decision.objectiveStack.length}, rules=${decision.decisionRules.length}, queue=${decision.operatorQueue.length}`,
		command: `re_decision_core ${decision.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "mission checkpoints/evidence/tool posture decision core",
	});
	updateMissionCheckpoint("decision_core_ready", "done", path);
	return path;
}
