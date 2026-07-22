/** Swarm write artifact (claim ledger + board + evidence). */

import { ensureReconStorage } from "../../resources.ts";
import { updateMissionCheckpoint } from "../deps.ts";
import { swarmArtifactPath } from "../paths.ts";
import type { SwarmArtifact } from "../types.ts";
import { writeSwarmModeBoards } from "./write-artifact-boards.ts";
import { appendSwarmArtifactEvidence } from "./write-artifact-evidence.ts";
import { persistSwarmRuntimeArtifacts } from "./write-artifact-persist.ts";
import { refreshSwarmArtifactRuntimeState } from "./write-artifact-refresh.ts";
import { withSwarmArtifactReverseNext } from "./write-artifact-reverse.ts";

export function writeSwarmArtifact(swarmInput: SwarmArtifact): string {
	const swarm = withSwarmArtifactReverseNext(swarmInput);
	ensureReconStorage();
	const path = swarmArtifactPath(swarm);
	refreshSwarmArtifactRuntimeState(swarm);
	// opt #162: atomic temp+rename for swarm runtime state writes —
	// a torn writeFileSync would leave truncated JSON/JSONL that the verifier
	// re-reads with no error (silent corruption). Same doctrine as #43/#103.
	persistSwarmRuntimeArtifacts(swarm, path);
	writeSwarmModeBoards(swarm, path);
	appendSwarmArtifactEvidence(swarm, path);
	updateMissionCheckpoint("swarm_plan_ready", "done", path);
	return path;
}
