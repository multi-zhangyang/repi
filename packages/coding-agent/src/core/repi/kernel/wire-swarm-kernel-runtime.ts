/** Wire-swarm: configureKernelRuntime bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { latestAutofixArtifactPath } from "../autofix/helpers.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestExploitChainArtifactPath } from "../exploit-chain/helpers.ts";
import { configureKernelRuntime } from "../kernel-runtime.ts";
import {
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestProofLoopArtifactPath,
} from "../memory-events-deps.ts";
import { latestDecisionCoreArtifactPath, latestKnowledgeGraphArtifactPath } from "../proof-loop-core/deps-latest.ts";
import { latestExploitLabArtifactPath } from "../reverse-io/exploit-pure.ts";
import { latestMobileRuntimeArtifactPath } from "../reverse-io/mobile-pure.ts";
import { latestNativeRuntimeArtifactPath } from "../reverse-io/native-pure.ts";
import {
	latestOperatorArtifactPath,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
} from "../reverse-io/shared.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import { commandTarget } from "../target.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireKernelRuntimeConfigure(pick: PickFn): void {
	configureKernelRuntime({
		appendEvidence: pick("appendEvidence", appendEvidence),
		commandTarget: pick("commandTarget", commandTarget),
		latestAutofixArtifactPath: pick("latestAutofixArtifactPath", latestAutofixArtifactPath),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		latestContextPackArtifactPath: pick("latestContextPackArtifactPath", latestContextPackArtifactPath),
		latestDecisionCoreArtifactPath: pick("latestDecisionCoreArtifactPath", latestDecisionCoreArtifactPath),
		latestExploitChainArtifactPath: pick("latestExploitChainArtifactPath", latestExploitChainArtifactPath),
		latestExploitLabArtifactPath: pick("latestExploitLabArtifactPath", latestExploitLabArtifactPath),
		latestKnowledgeGraphArtifactPath: pick("latestKnowledgeGraphArtifactPath", latestKnowledgeGraphArtifactPath),
		latestMobileRuntimeArtifactPath: pick("latestMobileRuntimeArtifactPath", latestMobileRuntimeArtifactPath),
		latestNativeRuntimeArtifactPath: pick("latestNativeRuntimeArtifactPath", latestNativeRuntimeArtifactPath),
		latestOperatorArtifactPath: pick("latestOperatorArtifactPath", latestOperatorArtifactPath),
		latestProofLoopArtifactPath: pick("latestProofLoopArtifactPath", latestProofLoopArtifactPath),
		latestReplayerArtifactPath: pick("latestReplayerArtifactPath", latestReplayerArtifactPath),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestVerifierArtifactPath: pick("latestVerifierArtifactPath", latestVerifierArtifactPath),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
