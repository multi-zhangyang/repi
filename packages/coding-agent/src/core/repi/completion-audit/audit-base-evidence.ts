/** Completion audit: mission/evidence/reverse/compact-resume gates. */

import { memoryPath } from "../memory-stubs.ts";
import { evidenceLedgerPath, readTextFile as readText } from "../storage.ts";
import { latestReconCompactionResumeTelemetry, readCurrentMission } from "./deps.ts";
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
	for (const checkpoint of mission.checkpoints) {
		if (checkpoint.status === "pending") blockers.push(`pending check: ${checkpoint.name}`);
		if (checkpoint.status === "blocked")
			blockers.push(`blocked check: ${checkpoint.name}${checkpoint.note ? ` — ${checkpoint.note}` : ""}`);
	}
	const evidence = readText(evidenceLedgerPath()).trim();
	const reverseAudit = auditReverseProofFromEvidence(evidence);
	const reverseSignals = reverseAudit.reverseSignals ?? [];
	const hasProofExit = Boolean((reverseAudit as any).hasRuntimeProofExit ?? (reverseAudit as any).hasProofExit);
	blockers.push(...reverseAudit.blockers);
	warnings.push(...reverseAudit.warnings);
	if (!evidence || evidence === "# REPI Evidence Ledger") blockers.push("evidence ledger is empty");
	if (!/(command|verify|path|offset|hash):/i.test(evidence))
		warnings.push("evidence ledger lacks command/path/offset/hash/verify metadata");
	const memory = readText(memoryPath("field-journal.md")).trim();
	const evolution = readText(memoryPath("evolution-log.md")).trim();
	if (!memory.includes("##") && !evolution.includes("##")) blockers.push("no field-journal/evolution entry recorded");
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
