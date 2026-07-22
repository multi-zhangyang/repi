/** Wire-swarm: configureSupervisor bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { buildClaimCheckResult, strictClaimCheckSnapshot } from "../claim-release.ts";
import { latestOrBuildDelegate } from "../delegate/build-output.ts";
import { appendEvidence } from "../evidence.ts";
import { readCurrentMission } from "../mission/io.ts";
import {
	commanderWorkerScoreboard,
	latestSwarmForSupervisor,
	supervisorClaimCheckPolicy,
	supervisorPlanCoverage,
	swarmCommanderMergeQueue,
} from "../supervisor/claim-policy.ts";
import { configureSupervisor } from "../supervisor/deps.ts";
import { reviewSwarmWorkerRuntime } from "../swarm-exec/run.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireSupervisorConfigure(pick: PickFn): void {
	configureSupervisor({
		appendEvidence: pick("appendEvidence", appendEvidence),
		buildClaimCheckResult: pick("buildClaimCheckResult", buildClaimCheckResult),
		commanderWorkerScoreboard: pick("commanderWorkerScoreboard", commanderWorkerScoreboard),
		latestOrBuildDelegate: pick("latestOrBuildDelegate", latestOrBuildDelegate),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestSwarmForSupervisor: pick("latestSwarmForSupervisor", latestSwarmForSupervisor),
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		reviewSwarmWorkerRuntime: pick("reviewSwarmWorkerRuntime", reviewSwarmWorkerRuntime),
		strictClaimCheckSnapshot: pick("strictClaimCheckSnapshot", strictClaimCheckSnapshot),
		supervisorClaimCheckPolicy: pick("supervisorClaimCheckPolicy", supervisorClaimCheckPolicy),
		supervisorPlanCoverage: pick("supervisorPlanCoverage", supervisorPlanCoverage),
		swarmCommanderMergeQueue: pick("swarmCommanderMergeQueue", swarmCommanderMergeQueue),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
