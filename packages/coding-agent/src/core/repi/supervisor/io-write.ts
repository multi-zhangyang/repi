/** Write supervisor artifact. */
import { join } from "node:path";
import { formatStrictClaimCheckSnapshot } from "../compiler-runtime/pure-claim.ts";
import { memoryPath } from "../memory-stubs.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceSupervisorsDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { formatSupervisor } from "./format.ts";
import type { SupervisorArtifact } from "./types.ts";

export function writeSupervisorArtifact(supervisor: SupervisorArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceSupervisorsDir(),
		`${supervisor.timestamp.replace(/[:.]/g, "-")}-${slug(supervisor.route ?? "supervisor")}-${supervisor.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Supervisor Artifact",
			"",
			formatSupervisor(supervisor, path),
			"",
			"## Worker reviews",
			"",
			...supervisor.reviews.map(
				(review: any) =>
					`- ${review.worker} verdict=${review.verdict} score=${review.score} packet=${review.packetId}`,
			),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(supervisor, null, 2),
			"```",
			"",
		].join("\n"),
	);
	writePrivateTextFile(
		memoryPath("commander-merge-board.md"),
		[
			"# REPI Commander Merge Board",
			"",
			`Updated: ${supervisor.timestamp}`,
			`Artifact: ${path}`,
			`Swarm artifact: ${supervisor.swarmArtifact ?? "none"}`,
			"",
			"## Worker scoreboard",
			...(supervisor.workerScoreboard.length
				? supervisor.workerScoreboard.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Commander merge budget",
			...(supervisor.commanderMergeBudget.length
				? supervisor.commanderMergeBudget.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Commander merge queue",
			...(supervisor.commanderMergeQueue.length
				? supervisor.commanderMergeQueue.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Parallel plan coverage",
			...(supervisor.planCoverage.length ? supervisor.planCoverage.map((item: any) => `- ${item}`) : ["- none"]),
			"",
			"## Claim checkpoint policy",
			...(supervisor.claimCheckPolicy.length
				? supervisor.claimCheckPolicy.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Release checkpoint metadata",
			...(supervisor.releaseCheckMetadata.length
				? supervisor.releaseCheckMetadata.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
			"## Strict claim checkpoint",
			...formatStrictClaimCheckSnapshot(supervisor.strictClaimCheck),
			"",
			"## Claim checkpoint result",
			...(supervisor.claimCheckResult.length
				? supervisor.claimCheckResult.map((item: any) => `- ${item}`)
				: ["- none"]),
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `supervisor-${supervisor.mode} ${supervisor.missionId ?? "no-mission"}`,
		fact: `Supervisor verdict ${supervisor.supervisorVerdict} across ${supervisor.reviews.length} worker review(s), ${supervisor.conflicts.length} conflict(s), ${supervisor.repairQueue.length} repair action(s), commander_merge=${supervisor.commanderMergeQueue.length}, commander_budget=${supervisor.commanderMergeBudget.length}, parallel_plan=${supervisor.parallelPlan?.planId ?? "missing"}, release_check_metadata=${supervisor.releaseCheckMetadata.length}, claim_check_policy=${supervisor.claimCheckPolicy.length}, strict_claim_check=${supervisor.strictClaimCheck?.status ?? "missing"}`,
		command: `re_supervisor ${supervisor.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "delegation/operation supervisor critic",
	});
	updateMissionCheckpoint(
		"supervisor_review_ready",
		supervisor.supervisorVerdict === "pass" ? "done" : "blocked",
		`${path} verdict=${supervisor.supervisorVerdict}`,
	);
	return path;
}
