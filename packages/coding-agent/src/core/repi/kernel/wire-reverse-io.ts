/** Wire-reverse: configureReverseIo bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestCompilerArtifactPath, latestContextPackArtifactPath } from "../memory-events-deps.ts";
import {
	configureReverseIo,
	latestKernelArtifactPath,
	latestOperatorArtifactPath,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
} from "../reverse-io/shared.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import type { PickFn } from "./wire-pick.ts";

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
