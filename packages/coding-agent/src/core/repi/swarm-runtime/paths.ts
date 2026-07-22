import { join } from "node:path";
import type { ArtifactScopeFilterOptions } from "../artifact-scope-types.ts";
import { evidenceSwarmsDir, readTextFile as readText } from "../storage.ts";
import { slug } from "../text.ts";
import { latestScopedMarkdownArtifact, scopedMarkdownArtifacts } from "./deps.ts";
/** Swarm artifact/path helpers. */
import type { SwarmArtifact } from "./types.ts";

export function latestSwarmArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("swarm", evidenceSwarmsDir(), options);
}

export function latestSwarmRunArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	for (const path of scopedMarkdownArtifacts("swarm", evidenceSwarmsDir(), 24, {
		...options,
		requestedBy: options.requestedBy ?? "latest_swarm_run_for_supervisor",
		write: options.write ?? false,
	})) {
		const text = readText(path);
		if (/^mode:\s*run$/im.test(text)) return path;
	}
	return undefined;
}

export function swarmArtifactPath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return join(
		evidenceSwarmsDir(),
		`${swarm.timestamp.replace(/[:.]/g, "-")}-${slug(swarm.route ?? "swarm")}-${swarm.mode}.md`,
	);
}

export function swarmClaimLedgerPath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-claim-ledger.jsonl");
}

export function swarmStructuredClaimMergePath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-structured-claim-merge.json");
}

export function swarmSubagentRuntimeManifestIndexPath(
	swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">,
): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-subagent-runtime-manifests.json");
}

export function swarmWorkerLeaseSchedulerPath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-worker-lease-scheduler.json");
}

export function swarmWorkerRetryHandoffClosurePath(swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-worker-retry-handoff-closure.json");
}

export function swarmWorkerRetryHandoffMergeSummaryPath(
	swarm: Pick<SwarmArtifact, "timestamp" | "route" | "mode">,
): string {
	return swarmArtifactPath(swarm).replace(/\.md$/i, "-worker-retry-handoff-merge-summary.json");
}
