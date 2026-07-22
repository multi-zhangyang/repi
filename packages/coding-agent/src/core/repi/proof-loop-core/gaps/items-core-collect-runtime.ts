/** Collect attack-graph/operator/compact/failure/checkpoint proof-loop gap items. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import {
	failureSignaturePriorityReport,
	latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
} from "../deps.ts";
import { proofLoopAttackGraphGapItems } from "./attack-graph.ts";
import type { createProofLoopGapCollector } from "./items-core-collect-helpers.ts";
import { proofLoopCheckStatus, proofLoopSourceArtifacts } from "./status.ts";

type Collector = ReturnType<typeof createProofLoopGapCollector>;

export function collectProofLoopRuntimeGaps(collector: Collector): void {
	const { targetRef, add } = collector;
	for (const graphGap of proofLoopAttackGraphGapItems(targetRef)) {
		add("attack_graph", graphGap.text, graphGap.sourceArtifacts);
	}
	const feedback = latestOperatorFeedback(targetRef);
	for (const row of feedback.rows
		.filter((item: any) => !/category=(strong_evidence|worker_retry_progress)/i.test(item))
		.slice(0, 16)) {
		add("operator_feedback", row, feedback.sourceArtifacts);
	}
	const compactResume = latestReconCompactionResumeTelemetry();
	const compactTelemetry = compactResume.telemetry;
	if (compactTelemetry) {
		for (const row of compactTelemetry.commandStatus) {
			if (row.status === "queued")
				add("compact_resume", `queued compact resume command: ${row.command}`, [
					compactResume.path,
					...compactTelemetry.sourceArtifacts,
				]);
			if (row.status === "blocked")
				add(
					"compact_resume",
					`blocked compact resume command: ${row.command}${row.outputSha256 ? ` output_sha256=${row.outputSha256}` : ""}`,
					[compactResume.path, ...compactTelemetry.sourceArtifacts],
				);
		}
		if (
			compactTelemetry.contractVerified &&
			compactTelemetry.autoResumeTriggered &&
			!compactTelemetry.proofLoopEntered
		)
			add("compact_resume", "compact resume proof loop has not been entered yet", [
				compactResume.path,
				...compactTelemetry.sourceArtifacts,
			]);
	}
	const failurePriority = failureSignaturePriorityReport(targetRef);
	for (const row of failurePriority.rows.slice(0, 12)) {
		add("failure_signature", row, failurePriority.sourceArtifacts);
	}
	for (const checkpoint of proofLoopCheckStatus()
		.filter((item: any) => /pending|blocked|missing/i.test(item))
		.slice(0, 12))
		add("checkpoint", checkpoint, proofLoopSourceArtifacts(targetRef));

	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${targetRef ?? ""} ${collector.items.map((item: any) => item.text).join(" ")}`,
		);
	if (reverseHeavy) {
		for (const cmd of reverseDomainCaptureNextCommands({
			routeOrBlob: `${targetRef ?? ""} proof_loop_gap`,
			target: targetRef,
			includeGates: true,
		}).slice(0, 3)) {
			add("artifact", `reverse_next: ${cmd}`, proofLoopSourceArtifacts(targetRef));
		}
	}
}
