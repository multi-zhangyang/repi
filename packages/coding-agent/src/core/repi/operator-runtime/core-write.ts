/** Operator write/show/latest-or-build with reverse missing-path next. */
import { join } from "node:path";
import { formatOperator } from "../operator-format.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceOperatorsDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildOperator } from "./core-build.ts";
import { latestOperatorArtifactPath, parseOperatorArtifact } from "./core-helpers.ts";
import { appendEvidence, appendRuntimeFailureRepairFromOperator, updateMissionCheckpoint } from "./deps.ts";
import { writeDispatcherFeedbackBoard } from "./dispatch.ts";

export function writeOperatorArtifact(operator: any): string {
	ensureReconStorage();
	const path = join(
		evidenceOperatorsDir(),
		`${operator.timestamp.replace(/[:.]/g, "-")}-${slug(operator.route ?? "operator")}-${operator.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Operator Artifact",
			"",
			formatOperator(operator, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(operator, null, 2),
			"```",
			"",
		].join("\n"),
	);
	const dispatcherBoard = writeDispatcherFeedbackBoard(operator, path);
	appendEvidence({
		kind: "artifact",
		title: `operator-${operator.mode} ${operator.missionId ?? "no-mission"}`,
		fact: `Operator queue ${operator.mode}: ${operator.steps.length} step(s), ${operator.executed.length} executed, ${operator.escalationQueue.length} escalation item(s), commander_policy=${operator.commanderPolicy.length}, commander_dispatch=${operator.commanderDispatchReport.length}, compact_resume_queue=${(operator.compactResumeQueue ?? []).length}, compact_resume_telemetry=${(operator.compactResumeTelemetry ?? []).length}, operator_feedback=${(operator.operatorFeedback ?? []).length}, operator_feedback_queue=${(operator.operatorFeedbackQueue ?? []).length}, dispatcher_fallback_plan=${(operator.dispatcherFallbackPlan ?? []).length}, dispatcher_feedback_scoreboard=${(operator.dispatcherFeedbackScoreboard ?? []).length}, dispatcher_learning_hints=${(operator.dispatcherLearningHints ?? []).length}, autonomous_budget=${operator.autonomousBudget?.maxTurns ?? "none"}/${operator.autonomousBudget?.maxDispatch ?? "none"}, score_decay=${(operator.dispatcherScoreDecay ?? []).length}, demotions=${(operator.repeatedFailureDemotions ?? []).length}, promotions=${(operator.highScorePromotions ?? []).length}, case_memory_lane_plan=${operator.caseMemoryLanePlan?.action ?? "none"}`,
		command: `re_operator ${operator.mode}`,
		path,
		verify: `cat ${path} && cat ${dispatcherBoard}`,
		confidence: "context-pack/operator dispatcher",
	});
	updateMissionCheckpoint("operator_queue_ready", "done", path);
	// Web/domain matrices use operation_queue_ready; keep both in sync.
	updateMissionCheckpoint("operation_queue_ready", "done", path);
	appendRuntimeFailureRepairFromOperator(operator, path);
	return path;
}

export function buildOperatorOutput(
	action: "plan" | "show" | "verify" | "escalate" = "plan",
	options: { target?: string } = {},
): string {
	if (action === "show") {
		const path = latestOperatorArtifactPath();
		if (!path) {
			const target = options.target;
			const reverseHeavy =
				/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					`${target ?? ""}`,
				);
			const next = reverseHeavy
				? reverseDomainCaptureNextCommands({ routeOrBlob: `${target ?? ""}`, target }).join(" | ")
				: "re_operator plan";
			return `operator_queue:\nstatus: missing\nnext: ${next}`;
		}
		return truncateMiddle(readText(path), 18000);
	}
	const operator = buildOperator({
		target: options.target,
		mode: action === "verify" || action === "escalate" ? action : "plan",
	});
	if (action === "escalate") operator.nextActions = operator.escalationQueue;
	const path = writeOperatorArtifact(operator);
	return formatOperator(operator, path);
}

export function latestOrBuildOperator(options: { target?: string } = {}): { operator: any; path: string } {
	const path = latestOperatorArtifactPath(options as any);
	if (path) {
		try {
			const operator = parseOperatorArtifact(path);
			if (operator) return { operator, path };
		} catch {
			// rebuild below
		}
	}
	const operator = buildOperator({ target: options.target, mode: "plan" });
	const written = writeOperatorArtifact(operator);
	return { operator, path: written };
}
