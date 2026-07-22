/** Proof-loop source/bridge/check status helpers. */
import { existsSync } from "node:fs";
import { latestAutofixArtifactPath } from "../../autofix.ts";
import { contextArtifactIndex } from "../../context-pack/index-resolve.ts";
import { readCurrentMission } from "../../mission.ts";
import { currentMissionPath, evidenceLedgerPath } from "../../storage.ts";
import { latestSupervisorArtifactPath } from "../../supervisor.ts";
import { truncateMiddle } from "../../text.ts";
import {
	latestAttackGraphArtifactPath,
	latestCompilerArtifactPath,
	latestDecisionCoreArtifactPath,
	latestDelegateArtifactPath,
	latestKnowledgeGraphArtifactPath,
	latestOperatorArtifactPath,
	latestReplayerArtifactPath,
	latestSwarmArtifactPath,
	latestVerifierArtifactPath,
} from "../deps.ts";

export function proofLoopSourceArtifacts(target?: string): string[] {
	const scope = target ? { target, requestedBy: "proof_loop_source_latest_artifact_consumer" } : {};
	return Array.from(
		new Set(
			[
				currentMissionPath(),
				evidenceLedgerPath(),
				latestDecisionCoreArtifactPath(scope),
				latestOperatorArtifactPath(scope),
				latestDelegateArtifactPath(scope),
				latestSwarmArtifactPath(scope),
				latestSupervisorArtifactPath(scope),
				latestVerifierArtifactPath(scope),
				latestCompilerArtifactPath(scope),
				latestReplayerArtifactPath(scope),
				latestAutofixArtifactPath(scope),
				latestAttackGraphArtifactPath(scope),
				latestKnowledgeGraphArtifactPath(scope),
				...contextArtifactIndex({ target, requestedBy: "proof_loop_source_artifact_index" }).map(
					(artifact: any) => artifact.path,
				),
			].filter((path): path is string => Boolean(path && existsSync(path))),
		),
	).slice(0, 64);
}

export function proofLoopBridgeArtifacts(target?: string): string[] {
	const scope = target ? { target, requestedBy: "proof_loop_bridge_latest_artifact_consumer" } : {};
	return [
		latestDelegateArtifactPath(scope),
		latestSwarmArtifactPath(scope),
		latestSupervisorArtifactPath(scope),
	].filter((path): path is string => Boolean(path && existsSync(path)));
}

export function proofLoopCheckStatus(): string[] {
	const mission = readCurrentMission();
	return (
		mission?.checkpoints
			.filter((checkpoint: any) =>
				/decision_core_ready|operator_queue_ready|verifier_matrix_ready|compiler_ready|replay_ready|autofix_ready|proof_loop_ready|knowledge_graph_ready|report_or_writeup_ready/i.test(
					checkpoint.name,
				),
			)
			.map(
				(checkpoint: any) =>
					`${checkpoint.name}: ${checkpoint.status}${checkpoint.note ? ` — ${truncateMiddle(checkpoint.note, 140)}` : ""}`,
			) ?? ["mission: missing"]
	);
}
