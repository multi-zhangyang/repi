/** Wire-swarm: configureDelegate bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestOrBuildOperation } from "../delegate/build-output.ts";
import { configureDelegate } from "../delegate/deps.ts";
import {
	delegateObjective,
	delegateTools,
	dispatcherPromotionQueue,
	latestWorkerScoreboard,
} from "../delegate/pure.ts";
import { dispatcherAdaptiveRoutingHints } from "../operator-runtime/dispatch/hints.ts";
import { delegateEvidenceContract } from "../proof-loop-core/deps-build.ts";
import { autonomousExecutionBudget, operatorCommandConcrete } from "../proof-loop-core/deps-run.ts";
import { buildWorkerPromotionQueue, workerAdaptiveRoutingHints } from "../reflection/types-config.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireDelegateConfigure(pick: PickFn): void {
	configureDelegate({
		appendEvidence: pick("appendEvidence", appendEvidence),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		buildWorkerPromotionQueue: pick("buildWorkerPromotionQueue", buildWorkerPromotionQueue),
		delegateEvidenceContract: pick("delegateEvidenceContract", delegateEvidenceContract),
		delegateObjective: pick("delegateObjective", delegateObjective),
		delegateTools: pick("delegateTools", delegateTools),
		dispatcherAdaptiveRoutingHints: pick("dispatcherAdaptiveRoutingHints", dispatcherAdaptiveRoutingHints),
		dispatcherPromotionQueue: pick("dispatcherPromotionQueue", dispatcherPromotionQueue),
		latestOrBuildOperation: pick("latestOrBuildOperation", latestOrBuildOperation),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestWorkerScoreboard: pick("latestWorkerScoreboard", latestWorkerScoreboard),
		operatorCommandConcrete: pick("operatorCommandConcrete", operatorCommandConcrete),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		workerAdaptiveRoutingHints: pick("workerAdaptiveRoutingHints", workerAdaptiveRoutingHints),
	});
}
