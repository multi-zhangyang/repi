/** Decision-core artifact construction. */
import { existsSync } from "node:fs";
import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { currentMissionPath, evidenceLedgerPath } from "../storage.ts";
import {
	activeLane,
	contextArtifactIndex,
	latestAutofixArtifactPath,
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestKernelArtifactPath,
	latestKnowledgeGraphArtifactPath,
	latestOperatorArtifactPath,
	latestProofLoopArtifactPath,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
	looksLikeNaturalLanguageTarget,
	memoryPath,
	sanitizeTargetForCommand,
	toolIndexPath,
} from "./deps.ts";
import {
	decisionArtifactPosture,
	decisionCheckPressure,
	decisionEvidencePriority,
	decisionObjectiveStack,
	decisionOperatorQueue,
	decisionRulesFor,
	decisionToolPosture,
} from "./rules.ts";
import type { DecisionCoreArtifact } from "./types.ts";

export function buildDecisionCore(
	options: { target?: string; mode?: DecisionCoreArtifact["mode"] } = {},
): DecisionCoreArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const active = mission ? activeLane(mission) : undefined;
	const target = sanitizeTargetForCommand(options.target) ?? sanitizeTargetForCommand(mission?.task);
	const objectiveStack = decisionObjectiveStack(mission, active, target);
	const checkPressure = decisionCheckPressure(mission);
	const evidencePriority = decisionEvidencePriority();
	const toolPosture = decisionToolPosture(mission);
	const artifactPosture = decisionArtifactPosture();
	const decisionRules = decisionRulesFor(mission, active, target);
	const operatorQueue = decisionOperatorQueue(decisionRules);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${mission?.route?.domain ?? ""} ${target ?? ""} decision-core`,
		target,
	}).slice(0, 4);
	const nextActions = Array.from(new Set([...reverseNext, ...operatorQueue])).slice(0, 12);
	const sourceArtifacts = Array.from(
		new Set(
			[
				currentMissionPath(),
				evidenceLedgerPath(),
				toolIndexPath?.(),
				memoryPath?.("execution-kernel.md"),
				memoryPath?.("decision-core.md"),
				latestKernelArtifactPath?.(),
				latestContextPackArtifactPath?.(),
				latestOperatorArtifactPath?.(),
				latestVerifierArtifactPath?.(),
				latestCompilerArtifactPath?.(),
				latestReplayerArtifactPath?.(),
				latestAutofixArtifactPath?.(),
				latestProofLoopArtifactPath?.(),
				latestKnowledgeGraphArtifactPath?.(),
				...((contextArtifactIndex?.() ?? []) as Array<{ path?: string }>).map((artifact: any) => artifact.path),
			].filter((path): path is string => Boolean(path && existsSync(String(path)))),
		),
	).slice(0, 48);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route?.domain,
		target,
		mode: options.mode ?? "plan",
		activeLane: active?.name,
		objectiveStack,
		checkPressure,
		evidencePriority,
		toolPosture,
		artifactPosture,
		decisionRules,
		operatorQueue,
		executed: [],
		blocked: [],
		nextActions,
		stopConditions: [
			"stop_only_when: mission checkpoints done or each remaining checkpoint has evidence-backed blocker",
			"stop_only_when: verifier/compiler/replayer outputs are bound to artifacts or explicit gaps",
			"never_stop_on: missing target/tool/context without emitting a concrete closure command",
			"reverse_proof_exit: require proof.exit=partial_runtime_capture|runtime_capture_strong before completion",
			...(looksLikeNaturalLanguageTarget?.(options.target ?? mission?.task)
				? [
						"invalid_natural_language_target_sanitized: run re_map . 2 or pass an explicit URL/file/directory/package",
					]
				: []),
		],
		sourceArtifacts,
	};
}
