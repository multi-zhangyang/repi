/** Wire-swarm: configureSwarmRuntime bag. */

import { latestScopedMarkdownArtifact, scopedMarkdownArtifacts } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestOrBuildDelegate } from "../delegate/build-output.ts";
import { operatorCommandConcrete } from "../proof-loop-core/deps-run.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import { refreshSwarmRuntimeClaimLedger } from "../structured-claim-merge/build.ts";
import { refreshSwarmRunDerivedFields } from "../swarm-exec/execute.ts";
import { deriveSwarmAuditFields } from "../swarm-exec/pure-audit.ts";
import { configureSwarmRuntime } from "../swarm-runtime/deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireSwarmRuntimeConfigure(pick: PickFn): void {
	configureSwarmRuntime({
		operatorCommandConcrete: pick("operatorCommandConcrete", operatorCommandConcrete),
		appendEvidence: pick("appendEvidence", appendEvidence),
		deriveSwarmAuditFields: pick("deriveSwarmAuditFields", deriveSwarmAuditFields),
		latestOrBuildDelegate: pick("latestOrBuildDelegate", latestOrBuildDelegate),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		refreshSwarmRunDerivedFields: pick("refreshSwarmRunDerivedFields", refreshSwarmRunDerivedFields),
		refreshSwarmRuntimeClaimLedger: pick("refreshSwarmRuntimeClaimLedger", refreshSwarmRuntimeClaimLedger),
		scopedMarkdownArtifacts: pick("scopedMarkdownArtifacts", scopedMarkdownArtifacts),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
