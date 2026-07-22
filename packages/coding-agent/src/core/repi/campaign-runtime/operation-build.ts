import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import type { CampaignPhase } from "../domain-proof-exit/types.ts";
import type { OperationStep } from "../operation-step-deps.ts";
import { ensureReconStorage } from "../resources.ts";
import type { OperationArtifact } from "../runtime-types/operation.ts";
import { evidenceOperationsDir } from "../storage.ts";
import { slug } from "../text.ts";
import { latestOrBuildCampaign } from "./campaign-write.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";
import { operationCommandConcrete } from "./operation-command.ts";

export function latestOperationArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("operation", evidenceOperationsDir(), options);
}

export function buildOperation(
	options: { target?: string; task?: string; mode?: "plan" | "run" } = {},
): OperationArtifact {
	ensureReconStorage();
	const { campaign, path: campaignArtifact } = latestOrBuildCampaign(options);
	const seen = new Set<string>();
	const steps: OperationStep[] = [];
	const addStep = (phase: CampaignPhase, command: string) => {
		const normalized = command.trim();
		if (!normalized || seen.has(`${phase.name}:${normalized}`)) return;
		seen.add(`${phase.name}:${normalized}`);
		const concrete = operationCommandConcrete(normalized, options.target ?? campaign.target);
		steps.push({
			id: `op:${steps.length + 1}:${slug(phase.name)}`,
			phase: phase.name,
			command: concrete.command,
			status: phase.status === "done" ? "done" : concrete.blocked ? "blocked" : "ready",
			reason: concrete.blocked ?? (phase.status === "done" ? "campaign phase already done" : undefined),
			sourceArtifacts: phase.sourceArtifacts,
		});
	};
	for (const phase of campaign.phases) {
		for (const command of phase.nextActions) addStep(phase, command);
	}
	const blocked = steps
		.filter((step: any) => step.status === "blocked")
		.map((step: any) => `${step.id} ${step.command}${step.reason ? ` — ${step.reason}` : ""}`);
	const nextActions = steps
		.filter((step: any) => step.status === "ready")
		.slice(0, 10)
		.map((step: any) => `re_operation run ${campaign.target ?? options.target ?? "<target>"} 1 # ${step.id}`);
	return {
		timestamp: new Date().toISOString(),
		missionId: campaign.missionId,
		route: campaign.route,
		target: options.target ?? campaign.target,
		campaignArtifact,
		mode: options.mode ?? "plan",
		steps,
		executed: [],
		blocked,
		nextActions,
		sourceArtifacts: Array.from(new Set([campaignArtifact, ...campaign.sourceArtifacts])).slice(0, 28),
	};
}
