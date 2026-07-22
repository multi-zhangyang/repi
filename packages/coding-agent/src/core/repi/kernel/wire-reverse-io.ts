/** Wire-reverse: configureReverseIo bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestCompilerArtifactPath } from "../compiler-runtime.ts";
import { latestContextPackArtifactPath } from "../context-pack.ts";
import { appendEvidence } from "../evidence.ts";
import { latestKernelArtifactPath } from "../kernel-runtime.ts";
import { latestOperatorArtifactPath } from "../operator-runtime.ts";
import { latestReplayerArtifactPath } from "../replayer-runtime.ts";
import { configureReverseIo } from "../reverse-io/shared.ts";
import { latestVerifierArtifactPath } from "../verifier-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

/**
 * IMPORTANT: fallbacks MUST be concrete artifact locators.
 * Never pass reverse-io/shared DI stubs (they call deps() → infinite recursion /
 * Maximum call stack size exceeded on re_native_runtime / re_runtime_adapter).
 */
export function wireReverseIoConfigure(pick: PickFn): void {
	configureReverseIo({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		latestVerifierArtifactPath: pick("latestVerifierArtifactPath", latestVerifierArtifactPath),
		latestReplayerArtifactPath: pick("latestReplayerArtifactPath", latestReplayerArtifactPath),
		latestOperatorArtifactPath: pick("latestOperatorArtifactPath", latestOperatorArtifactPath),
		latestContextPackArtifactPath: pick("latestContextPackArtifactPath", latestContextPackArtifactPath),
		latestKernelArtifactPath: pick("latestKernelArtifactPath", latestKernelArtifactPath),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
	});
}
