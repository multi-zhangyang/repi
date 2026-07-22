/** Kernel criteria: artifact sources + directives. */
import { existsSync } from "node:fs";
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { ensureReconStorage } from "../resources.ts";
import {
	builtinSkillFilePath,
	currentMissionPath,
	evidenceKernelDir,
	evidenceLedgerPath,
	memoryPath,
	toolIndexPath,
} from "../storage.ts";
import { d } from "./deps.ts";

export { kernelDirectives } from "./criteria-policy-directives.ts";

export function latestKernelArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return d().latestScopedMarkdownArtifact("kernel", evidenceKernelDir(), options);
}

export function kernelSourceArtifacts(): string[] {
	ensureReconStorage();
	const candidates = [
		builtinSkillFilePath(),
		toolIndexPath(),
		currentMissionPath(),
		evidenceLedgerPath(),
		memoryPath("field-journal.md"),
		memoryPath("case-index.md"),
		memoryPath("evolution-log.md"),
		memoryPath("knowledge-graph-index.md"),
		memoryPath("decision-core.md"),
		d().latestDecisionCoreArtifactPath(),
		d().latestKnowledgeGraphArtifactPath(),
		d().latestContextPackArtifactPath(),
		d().latestOperatorArtifactPath(),
		d().latestVerifierArtifactPath(),
		d().latestCompilerArtifactPath(),
		d().latestReplayerArtifactPath(),
		d().latestExploitChainArtifactPath(),
		d().latestExploitLabArtifactPath(),
		d().latestMobileRuntimeArtifactPath(),
		d().latestNativeRuntimeArtifactPath(),
		d().latestAutofixArtifactPath(),
		d().latestProofLoopArtifactPath(),
	].filter((path): path is string => Boolean(path && existsSync(path)));
	return Array.from(new Set(candidates));
}
