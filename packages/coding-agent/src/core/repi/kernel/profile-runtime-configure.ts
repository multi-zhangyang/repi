/** REPI profile bootstrap configure chain. */

import { configureClaimRelease } from "../claim-release.ts";
import { latestCompilerArtifactPath } from "../compiler-runtime.ts";
import { latestContextPackArtifactPath } from "../context-pack.ts";
import { configureDomainProofExit } from "../domain-proof-exit.ts";
import { appendEvidence, configureEvidenceRuntime } from "../evidence.ts";
import { configureLaneMemory } from "../lane-memory.ts";
import { configureMemoryCandidates } from "../memory-candidates.ts";
import { configureMemoryDeposition } from "../memory-deposition.ts";
import { configureMemoryEvents } from "../memory-events.ts";
import { updateMissionCheckpoint, upsertMissionCheckpoint } from "../mission.ts";
import { latestProofLoopArtifactPath } from "../proof-loop-runtime.ts";
import { configureReplayerRuntime } from "../replayer-runtime.ts";
import { ensureRepiStorage } from "../storage.ts";
import { latestSupervisorArtifactPath } from "../supervisor.ts";
import { configureToolBootstrap } from "../tool-bootstrap.ts";
import { refreshToolIndex } from "../tool-index.ts";
import { configureToolTrace } from "../tool-trace.ts";
import { configureToolchainRuntime } from "../toolchain-runtime.ts";

export function configureRepiProfileBootstrap(): void {
	ensureRepiStorage();
	configureEvidenceRuntime({ updateMissionCheckpoint });
	configureClaimRelease();
	configureToolTrace();
	configureLaneMemory();
	configureToolBootstrap({
		refreshToolIndex,
		upsertMissionCheckpoint,
	});
	configureDomainProofExit();
	configureToolchainRuntime({
		appendEvidence,
	});
	configureMemoryEvents({
		latestCompilerArtifactPath,
		latestContextPackArtifactPath,
		latestProofLoopArtifactPath,
		latestSupervisorArtifactPath,
	});
	configureMemoryCandidates();
	configureMemoryDeposition();
	configureReplayerRuntime({
		appendEvidence,
		updateMissionCheckpoint,
	});
}
