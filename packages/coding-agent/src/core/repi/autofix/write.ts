/** Autofix write/repair helpers. */
import { join } from "node:path";
import { buildRepairRollbackPolicyFromAutofix, repairRollbackPolicyRuntimePath } from "../repair-rollback.ts";
import type { RepairRollbackPolicyV1 } from "../repair-rollback-types.ts";

function verifyRepairRollbackPolicyV1(report: RepairRollbackPolicyV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	if (!report || report.kind !== "RepairRollbackPolicyV1") errors.push("invalid_policy_kind");
	if (!report?.failureLedgerEvents) errors.push("missing_failure_ledger");
	if (!report?.repairQueue) errors.push("missing_repair_queue");
	return { ok: errors.length === 0, errors };
}

import { formatAutofix } from "../autofix-format.ts";
import { appendFailureRepairLedger } from "../failure-repair.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceAutofixDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import {
	appendAutofixMemoryEvent,
	appendEvidence,
	appendRuntimeFailureRepairFromAutofix,
	updateMissionCheckpoint,
} from "./deps.ts";
import type { AutofixArtifact } from "./types.ts";

export function writeAutofixArtifact(autofix: AutofixArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceAutofixDir(),
		`${autofix.timestamp.replace(/[:.]/g, "-")}-${slug(autofix.route ?? "autofix")}-${autofix.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Autofix Artifact",
			"",
			formatAutofix(autofix, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(autofix, null, 2),
			"```",
			"",
		].join("\n"),
	);
	const repairRollback = writeAutofixRepairRollbackPolicy(autofix, path);
	autofix.repairRollbackPolicyPath = repairRollback.path;
	autofix.repairRollbackPolicyStatus = repairRollback.status;
	autofix.repairRollbackPolicyErrors = repairRollback.errors;
	writePrivateTextFile(
		path,
		[
			"# REPI Autofix Artifact",
			"",
			formatAutofix(autofix, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(autofix, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: "artifact",
		title: `autofix-${autofix.mode} ${autofix.missionId ?? "no-mission"}`,
		fact: `Autofix ${autofix.mode}: failures=${autofix.failures.length}, patch=${autofix.patchQueue.length}, substitutions=${autofix.commandSubstitutions.length}, bootstrap=${autofix.bootstrapQueue.length}, recapture=${autofix.evidenceRecaptureQueue.length}, operator_feedback=${(autofix.operatorFeedback ?? []).length}`,
		command: `re_autofix ${autofix.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "replay/compile repair queue",
	});
	updateMissionCheckpoint("autofix_ready", "done", path);
	appendRuntimeFailureRepairFromAutofix(autofix, path);
	appendAutofixMemoryEvent(autofix, path);
	return path;
}

export function writeAutofixRepairRollbackPolicy(
	autofix: AutofixArtifact,
	autofixArtifactPath: string,
): { path?: string; status: "pass" | "blocked" | "missing"; errors: string[]; report?: RepairRollbackPolicyV1 } {
	if (!autofix.patchQueue.length && autofix.mode !== "apply") {
		return { status: "missing", errors: ["state_changing_repair_not_queued"] };
	}
	const reportPath =
		autofix.repairRollbackPolicyPath ?? repairRollbackPolicyRuntimePath("re_autofix", autofix.timestamp);
	const report = buildRepairRollbackPolicyFromAutofix(
		{ ...autofix, repairRollbackPolicyPath: reportPath },
		autofixArtifactPath,
	);
	const validation = verifyRepairRollbackPolicyV1(report);
	// Atomic (temp+rename 0o600) — a torn writeFileSync would leave truncated
	// policy JSON that readers silently skip, losing the repair-rollback policy
	// + validation. Mirrors surrounding autofix state writes. (#203)
	writePrivateTextFile(reportPath, `${JSON.stringify({ report, validation }, null, 2)}\n`);
	appendFailureRepairLedger({ failures: report.failureLedgerEvents, repairs: report.repairQueue });
	return { path: reportPath, status: validation.ok ? "pass" : "blocked", errors: validation.errors, report };
}
