import type { ArtifactScopeFilterOptions } from "../../artifact-scope-types.ts";
import { evidenceSwarmsDir, readTextFile as readText } from "../../storage.ts";
import { latestScopedMarkdownArtifact, scopedMarkdownArtifacts } from "../deps.ts";

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

export function swarmSpawnPrompt(packet: any, target?: string): string[] {
	return [
		`role=${packet.worker}`,
		`target=${target ?? "<target>"}`,
		`objective=${packet.objective}`,
		`evidence_contract=${packet.evidenceContract.join(" | ")}`,
		`source_artifacts=${packet.sourceArtifacts.join(" | ") || "none"}`,
		`commands=${
			packet.steps
				.filter((step: any) => step.status === "ready")
				.slice(0, 5)
				.map((step: any) => step.command)
				.join(" || ") || "inspect source artifacts and return gap"
		}`,
		"return_format=Outcome -> Key Evidence -> Verification -> Next Step; include paths/hashes/commands only",
	];
}
