/** Completion audit: mission/evidence/reverse/compact-resume gates. */

import { memoryPath } from "../memory-stubs.ts";
import { evidenceLedgerPath, readTextFile as readText } from "../storage.ts";
import { latestReconCompactionResumeTelemetry, readCurrentMission } from "./deps.ts";
import { readEvidenceLedgerTail } from "./evidence-ledger-tail.ts";
import { auditReverseProofFromEvidence } from "./reverse.ts";

export function auditCompletionEvidenceGates(): {
	mission: any;
	blockers: string[];
	warnings: string[];
	reverseSignals: any;
	hasProofExit: boolean;
	earlyReturn?: { ready: false; blockers: string[]; warnings: string[] };
} {
	const mission = readCurrentMission();
	const blockers: string[] = [];
	const warnings: string[] = [];
	if (!mission) {
		blockers.push("no active mission");
		return {
			mission: undefined,
			blockers,
			warnings,
			reverseSignals: [],
			hasProofExit: false,
			earlyReturn: { ready: false, blockers, warnings },
		};
	}
	const evidence = readEvidenceLedgerTail(evidenceLedgerPath());
	const reverseAudit = auditReverseProofFromEvidence(evidence);
	const reverseSignals = reverseAudit.reverseSignals ?? [];
	const hasProofExit = Boolean((reverseAudit as any).hasRuntimeProofExit ?? (reverseAudit as any).hasProofExit);
	const reverseReady = Boolean(
		hasProofExit &&
			((reverseAudit as any).bindReady === true ||
				/bind_ready=true|proof\.exit=runtime_capture_strong|proof\.exit=partial_runtime_capture/i.test(evidence)),
	);
	// Hard vs soft checkpoints: reverse-ready sessions must not be blocked by optional
	// orchestration scaffolding (kernel/decision/report/swarm) once runtime proof binds.
	const hardPending = new Set([
		"passive_map_done",
		"minimal_path_proven",
		"reverse_proof_exit_ready",
		// Domain runtime gates are hard only when reverse proof is NOT yet bound.
		// After runtime_capture_strong + bind_ready, remaining domain tools are follow-ups.
	]);
	const softWhenReverseReady = new Set([
		"execution_kernel_ready",
		"decision_core_ready",
		"operator_queue_ready",
		"operation_queue_ready",
		"replay_ready",
		"compiler_ready",
		"proof_loop_ready",
		"attack_graph_ready",
		"report_or_writeup_ready",
		"knowledge_graph_ready",
		"delegation_packets_ready",
		"swarm_plan_ready",
		"supervisor_review_ready",
		"context_pack_ready",
		"profile_check_ready",
	]);
	for (const checkpoint of mission.checkpoints) {
		if (checkpoint.status === "blocked") {
			blockers.push(`blocked check: ${checkpoint.name}${checkpoint.note ? ` — ${checkpoint.note}` : ""}`);
			continue;
		}
		if (checkpoint.status !== "pending") continue;
		const name = checkpoint.name;
		if (reverseReady && softWhenReverseReady.has(name)) {
			warnings.push(`pending optional check (reverse proof ready): ${name}`);
			continue;
		}
		const domainRuntime = new Set([
			"live_browser_ready",
			"web_authz_ready",
			"native_runtime_ready",
			"mobile_runtime_ready",
			"js_signing_ready",
			"verifier_matrix_ready",
		]);
		if (reverseReady && (softWhenReverseReady.has(name) || domainRuntime.has(name))) {
			warnings.push(`pending optional check (reverse proof ready): ${name}`);
			continue;
		}
		if (hardPending.has(name) || !reverseReady) {
			blockers.push(`pending check: ${name}`);
		} else {
			warnings.push(`pending optional check: ${name}`);
		}
	}
	blockers.push(...reverseAudit.blockers);
	warnings.push(...reverseAudit.warnings);
	if (!evidence || evidence === "# REPI Evidence Ledger") blockers.push("evidence ledger is empty");
	if (!/(command|verify|path|offset|hash):/i.test(evidence))
		warnings.push("evidence ledger lacks command/path/offset/hash/verify metadata");
	const memory = readText(memoryPath("field-journal.md")).trim();
	const evolution = readText(memoryPath("evolution-log.md")).trim();
	if (!memory.includes("##") && !evolution.includes("##")) {
		if (reverseReady) warnings.push("no field-journal/evolution entry recorded");
		else blockers.push("no field-journal/evolution entry recorded");
	}
	const compactResume = latestReconCompactionResumeTelemetry();
	if (compactResume.telemetry?.contractVerified && compactResume.telemetry.autoResumeTriggered) {
		const queued = compactResume.telemetry.commandStatus.filter((row: any) => row.status === "queued");
		const blocked = compactResume.telemetry.commandStatus.filter((row: any) => row.status === "blocked");
		if (queued.length) warnings.push(`compact resume still has ${queued.length} queued command(s)`);
		if (blocked.length) blockers.push(`compact resume blocked command(s): ${blocked.length}`);
		if (!compactResume.telemetry.proofLoopEntered) blockers.push("compact resume triggered without proof loop entry");
	}
	return { mission, blockers, warnings, reverseSignals, hasProofExit };
}
