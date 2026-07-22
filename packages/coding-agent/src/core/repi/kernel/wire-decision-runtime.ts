/** Wire-decision: configureDecisionRuntime bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { latestAutofixArtifactPath } from "../autofix/helpers.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { contextArtifactIndex } from "../context-pack/index.ts";
import { decisionOperatorSteps } from "../decision-runtime/rules.ts";
import { configureDecisionRuntime } from "../decision-runtime.ts";
import { latestKnowledgeGraphArtifactPath } from "../knowledge-graph/io.ts";
import {
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestProofLoopArtifactPath,
} from "../memory-events-deps.ts";
import { activeLane } from "../mission/lane-helpers.ts";
import { executeOperatorStep } from "../operator-step.ts";
import {
	latestKernelArtifactPath,
	latestOperatorArtifactPath,
	latestReplayerArtifactPath,
	latestVerifierArtifactPath,
} from "../reverse-io/shared.ts";
import { appendEvidence, parseToolIndex } from "../runtime-adapter-exec-deps.ts";
import { toolIndexPath } from "../storage/paths/core.ts";
import { commandTarget, looksLikeNaturalLanguageTarget, sanitizeTargetForCommand } from "../target.ts";
import { bootstrapCatalogFor } from "../tool-index/catalog-core.ts";
import { recommendedToolsForRoute } from "../tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireDecisionRuntimeConfigure(pick: PickFn): void {
	configureDecisionRuntime({
		activeLane: pick("activeLane", activeLane),
		appendEvidence: pick("appendEvidence", appendEvidence),
		bootstrapCatalogFor: pick("bootstrapCatalogFor", bootstrapCatalogFor),
		commandTarget: pick("commandTarget", commandTarget),
		contextArtifactIndex: pick("contextArtifactIndex", contextArtifactIndex),
		decisionOperatorSteps: pick("decisionOperatorSteps", decisionOperatorSteps),
		executeOperatorStep: pick("executeOperatorStep", executeOperatorStep),
		latestAutofixArtifactPath: pick("latestAutofixArtifactPath", latestAutofixArtifactPath),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		latestContextPackArtifactPath: pick("latestContextPackArtifactPath", latestContextPackArtifactPath),
		latestKernelArtifactPath: pick("latestKernelArtifactPath", latestKernelArtifactPath),
		latestKnowledgeGraphArtifactPath: pick("latestKnowledgeGraphArtifactPath", latestKnowledgeGraphArtifactPath),
		latestOperatorArtifactPath: pick("latestOperatorArtifactPath", latestOperatorArtifactPath),
		latestProofLoopArtifactPath: pick("latestProofLoopArtifactPath", latestProofLoopArtifactPath),
		latestReplayerArtifactPath: pick("latestReplayerArtifactPath", latestReplayerArtifactPath),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestVerifierArtifactPath: pick("latestVerifierArtifactPath", latestVerifierArtifactPath),
		looksLikeNaturalLanguageTarget: pick("looksLikeNaturalLanguageTarget", looksLikeNaturalLanguageTarget),
		parseToolIndex: pick("parseToolIndex", parseToolIndex),
		recommendedToolsForRoute: pick("recommendedToolsForRoute", recommendedToolsForRoute),
		sanitizeTargetForCommand: pick("sanitizeTargetForCommand", sanitizeTargetForCommand),
		toolIndexPath: pick("toolIndexPath", toolIndexPath),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
