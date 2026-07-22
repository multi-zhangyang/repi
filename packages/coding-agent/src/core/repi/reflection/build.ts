/** Reflection build/format. */

import { parseWorkerScoreboardLine, type WorkerScoreboardEntry } from "../operator-runtime/dispatch/feedback-parse.ts";
import { ensureReconStorage } from "../resources.ts";
import type { ReflectionArtifact } from "./types-config.ts";
import { buildWorkerPromotionQueue, latestOrBuildSupervisor, workerAdaptiveRoutingHints } from "./types-config.ts";

export function formatReflection(reflection: ReflectionArtifact, path?: string): string {
	return [
		"reflection_cycle:",
		path ? `reflection_artifact: ${path}` : undefined,
		`timestamp: ${reflection.timestamp}`,
		`mode: ${reflection.mode}`,
		`mission_id: ${reflection.missionId ?? "none"}`,
		`route: ${reflection.route ?? "none"}`,
		`target: ${reflection.target ?? "<none>"}`,
		`supervisor_artifact: ${reflection.supervisorArtifact ?? "none"}`,
		reflection.playbookPath ? `playbookpath: ${reflection.playbookPath}` : undefined,
		reflection.journalAnchor ? `field_journal_anchor: ${reflection.journalAnchor}` : undefined,
		reflection.evolutionAnchor ? `evolution_anchor: ${reflection.evolutionAnchor}` : undefined,
		"lessons:",
		...(reflection.lessons.length ? reflection.lessons.map((item: any) => `- ${item}`) : ["- none"]),
		"failure_patterns:",
		...(reflection.failurePatterns.length ? reflection.failurePatterns.map((item: any) => `- ${item}`) : ["- none"]),
		"reuse_rules:",
		...(reflection.reuseRules.length ? reflection.reuseRules.map((item: any) => `- ${item}`) : ["- none"]),
		"repair_playbook:",
		...(reflection.repairPlaybook.length ? reflection.repairPlaybook.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(reflection.nextActions.length
			? reflection.nextActions.map((item: any) => `- ${item}`)
			: ["- re_complete audit"]),
		`next_reflect_command: ${reflection.mode === "write" ? "re_note list" : "re_reflect write"}`,
		"source_artifacts:",
		...(reflection.sourceArtifacts.length ? reflection.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function buildReflection(
	options: { target?: string; task?: string; mode?: "plan" | "write" } = {},
): ReflectionArtifact {
	ensureReconStorage();
	const { supervisor, path: supervisorArtifact } = latestOrBuildSupervisor(options);
	const failing = supervisor.reviews.filter(
		(review: any) => review.verdict === "blocked" || review.verdict === "repair",
	);
	const watching = supervisor.reviews.filter((review: any) => review.verdict === "watch");
	const passing = supervisor.reviews.filter((review: any) => review.verdict === "pass");
	const scoreboardEntries = supervisor.workerScoreboard
		.map(parseWorkerScoreboardLine)
		.filter((entry: any): entry is WorkerScoreboardEntry => Boolean(entry));
	const adaptiveRoutingHints = workerAdaptiveRoutingHints(scoreboardEntries, options.target ?? supervisor.target);
	const promotionQueue = buildWorkerPromotionQueue(scoreboardEntries, options.target ?? supervisor.target);
	const lessons = Array.from(
		new Set([
			`supervisor_verdict=${supervisor.supervisorVerdict}; workers=${supervisor.reviews.length}; repairs=${supervisor.repairQueue.length}`,
			...supervisor.workerScoreboard.slice(0, 8).map((item: any) => `worker_scoreboard: ${item}`),
			...passing.map(
				(review: any) =>
					`${review.worker}: preserve packet shape; score=${review.score}; ${review.rationale.join(" | ")}`,
			),
			...watching.map(
				(review: any) => `${review.worker}: watch weak evidence before expansion; score=${review.score}`,
			),
			...failing.map(
				(review: any) => `${review.worker}: route to repair before claiming completion; score=${review.score}`,
			),
		]),
	).slice(0, 24);
	const failurePatterns = Array.from(
		new Set([
			...supervisor.conflicts,
			...failing.flatMap((review: any) => review.conflicts.map((item: any) => `${review.worker}: ${item}`)),
			...failing.flatMap((review: any) => review.evidenceGaps.map((item: any) => `${review.worker}: ${item}`)),
			...supervisor.checkpoints
				.filter((checkpoint: any) => /pending|blocked/i.test(checkpoint))
				.map((checkpoint: any) => `check: ${checkpoint}`),
		]),
	).slice(0, 32);
	const reuseRules = Array.from(
		new Set([
			"Before broad expansion: re_map → re_live_browser → re_graph → re_campaign → re_operation → re_delegate → re_swarm → re_supervisor → re_reflect.",
			"When supervisor_verdict is repair/blocked: execute repair_queue before report scaffold.",
			"When worker score is watch: collect one more runtime/traffic/artifact anchor before lateral movement.",
			...adaptiveRoutingHints.map((item: any) => `adaptive_route: ${item}`),
			...promotionQueue.map((item: any) => `promotion: ${item}`),
			...supervisor.priorityQueue.slice(0, 8).map((item: any) => `prioritize: ${item}`),
		]),
	).slice(0, 24);
	const repairPlaybook = Array.from(
		new Set([...supervisor.repairQueue, ...supervisor.nextActions, "re_supervisor review", "re_complete audit"]),
	).slice(0, 32);
	return {
		timestamp: new Date().toISOString(),
		missionId: supervisor.missionId,
		route: supervisor.route,
		target: options.target ?? supervisor.target,
		mode: options.mode ?? "plan",
		supervisorArtifact,
		lessons,
		failurePatterns,
		reuseRules,
		repairPlaybook,
		nextActions: [
			...(repairPlaybook.length ? repairPlaybook.slice(0, 6) : ["re_operation next"]),
			"re_note list",
			"re_complete audit",
		],
		sourceArtifacts: Array.from(new Set([supervisorArtifact, ...supervisor.sourceArtifacts])).slice(0, 28),
	};
}
