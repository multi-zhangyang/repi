/** Campaign write/format/output helpers. */
import { join } from "node:path";
import { formatCampaign } from "../domain-proof-exit/pure.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceCampaignsDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildCampaign, latestCampaignArtifactPath, parseCampaignArtifact } from "./campaign-build.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import type { CampaignArtifact } from "./types.ts";

export function writeCampaignArtifact(campaign: CampaignArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceCampaignsDir(),
		`${campaign.timestamp.replace(/[:.]/g, "-")}-${slug(campaign.route ?? "campaign")}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Campaign Artifact",
			"",
			formatCampaign(campaign, path),
			"",
			"## Phases",
			"",
			...campaign.phases.map(
				(phase) =>
					`- ${phase.name} status=${phase.status} route=${phase.route} lanes=${phase.candidateLanes.join(",") || "none"} evidence=${phase.requiredEvidence.join(";")}`,
			),
			"",
			"## Pivots",
			"",
			...campaign.pivots.map((item: any) => `- ${item}`),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(campaign, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `campaign-plan ${campaign.missionId ?? "no-mission"}`,
		fact: `Built campaign graph with ${campaign.phases.length} phase(s), ${campaign.pivots.length} pivot(s), ${campaign.gaps.length} evidence gap(s), ${campaign.toolGaps.length} tool gap(s)`,
		command: "re_campaign plan",
		path,
		verify: `cat ${path}`,
		confidence: "mission/map/run/evidence/attack-graph campaign",
	});
	updateMissionCheckpoint("campaign_plan_ready", "done", path);
	return path;
}

export function buildCampaignOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; task?: string } = {},
): string {
	if (action === "show") {
		const path = latestCampaignArtifactPath();
		if (!path) {
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: "campaign missing reverse",
				target: options.target,
			}).slice(0, 3);
			return [
				"campaign_graph:",
				"status: missing",
				"next: re_campaign plan",
				"reverse_domain_next:",
				...reverseNext.map((cmd: any) => `- next: ${cmd}`),
			].join("\n");
		}
		return truncateMiddle(readText(path), 14000);
	}
	const campaign = buildCampaign(options);
	const path = writeCampaignArtifact(campaign);
	const base = formatCampaign(campaign, path);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${campaign.route ?? ""} ${campaign.target ?? ""} campaign ${action}`,
		target: campaign.target,
	}).slice(0, 3);
	return [base, "", "reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)].join("\n");
}

export function latestOrBuildCampaign(options: { target?: string; task?: string } = {}): {
	campaign: CampaignArtifact;
	path: string;
} {
	const latest = !options.target && !options.task ? latestCampaignArtifactPath() : undefined;
	if (latest) {
		const campaign = parseCampaignArtifact(latest);
		if (campaign) return { campaign, path: latest };
	}
	const campaign = buildCampaign(options);
	const path = writeCampaignArtifact(campaign);
	return { campaign, path };
}
