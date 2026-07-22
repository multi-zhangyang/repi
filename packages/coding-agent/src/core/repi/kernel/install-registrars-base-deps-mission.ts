/** Install base deps: mission/evidence/completion slice. */

import { buildAttackGraphOutput, latestAttackGraphArtifactPath } from "../attack-graph.ts";
import { runAutoLaneChain } from "../auto-lane.ts";
import {
	auditCompletion,
	buildEvidenceDigest,
	formatCompletionAudit,
	formatCompletionAuditFromAudit,
	formatMission,
	writeDomainProofExitClosureArtifact,
	writeReportScaffold,
} from "../completion-audit.ts";
import { appendEvidence } from "../evidence.ts";
import { formatLaneCommandPack, laneCommandPack, runLaneCommandPack } from "../lane-commands.ts";
import { appendCompletionMemoryEvent } from "../memory-events.ts";
import {
	activeLane,
	buildMissionDigest,
	createMission,
	formatLaneQueue,
	readCurrentMission,
	updateMissionCheckpoint,
	updateMissionLane,
	writeCurrentMission,
} from "../mission.ts";
import { buildOperatorOutput, dispatchOperatorQueue, latestOperatorArtifactPath } from "../operator-runtime.ts";
import { runPassiveMap } from "../passive-map.ts";
import { formatRoute, routeReconTask } from "../routes.ts";
import { currentMissionPath, evidenceLedgerPath, evidenceMapsDir, toolIndexPath } from "../storage.ts";
import { techniqueIdsForRoute } from "../techniques.ts";
import { truncateMiddle } from "../text.ts";
import { activateRepiToolsForRoute as activateToolsForRoute } from "./harness-modes.ts";
import { sendDisplayMessage } from "./session-helpers.ts";

export const installBaseMissionDeps = {
	activateToolsForRoute,
	activeLane,
	buildMissionDigest,
	createMission,
	formatLaneQueue,
	readCurrentMission,
	updateMissionCheckpoint,
	updateMissionLane,
	writeCurrentMission,
	appendCompletionMemoryEvent,
	appendEvidence,
	auditCompletion,
	buildEvidenceDigest,
	formatCompletionAudit,
	formatCompletionAuditFromAudit,
	formatMission,
	writeDomainProofExitClosureArtifact,
	writeReportScaffold,
	buildAttackGraphOutput,
	latestAttackGraphArtifactPath,
	buildOperatorOutput,
	dispatchOperatorQueue,
	latestOperatorArtifactPath,
	currentMissionPath,
	evidenceLedgerPath,
	evidenceMapsDir,
	toolIndexPath,
	formatLaneCommandPack,
	laneCommandPack,
	runLaneCommandPack,
	formatRoute,
	routeReconTask,
	runAutoLaneChain,
	runPassiveMap,
	sendDisplayMessage,
	techniqueIdsForRoute,
	truncateMiddle,
} as const;
