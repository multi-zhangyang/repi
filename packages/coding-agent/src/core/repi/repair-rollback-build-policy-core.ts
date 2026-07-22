/** Core repair/failure objects for autofix rollback policy. */

import type { AutofixArtifact } from "./autofix.ts";
import { buildRuntimeFailureRepair, runtimeFailureCommandTarget } from "./repair-rollback-core.ts";
import { uniqueNonEmpty } from "./text.ts";

export function buildAutofixRepairRollbackCore(params: {
	autofix: AutofixArtifact;
	autofixArtifactPath: string;
	reportPath: string;
	baselinePath: string;
	baselineTreeSha256: string;
	allowlist: string[];
	stateChangingCommands: string[];
}): { failure: any; repair: any; targetRef: string; changedFiles: string[] } {
	const {
		autofix,
		autofixArtifactPath,
		reportPath,
		baselinePath,
		baselineTreeSha256,
		allowlist,
		stateChangingCommands,
	} = params;
	const changedFiles = uniqueNonEmpty(
		[autofixArtifactPath, ...autofix.patchQueue.flatMap((item: any) => item.sourceArtifacts)],
		32,
	).filter((path: any) => allowlist.includes(path));
	const targetRef = runtimeFailureCommandTarget(autofix.target);
	const { failure, repair } = buildRuntimeFailureRepair({
		source: "re_autofix",
		scope: `${autofix.target ?? autofix.route ?? autofix.missionId ?? "autofix"}:repair-rollback-policy`,
		target: autofix.target,
		reason:
			"state-changing autofix repair is guarded by baseline, allowlist, regression checkpoint, and rollback restore proof",
		category: "contract_gap",
		status: "repair_queued",
		commands: stateChangingCommands.length
			? stateChangingCommands
			: [`re_autofix apply ${targetRef}`, `npm run check`],
		failedChecks: ["autofix_ready", "repair_rollback_policy", "check:repair-rollback-policy"],
		sourceArtifacts: allowlist,
		expectedArtifacts: [autofixArtifactPath, reportPath, baselinePath],
		maxAttempts: 1,
		unblock: `npm run check && re_autofix apply ${targetRef}`,
	});
	failure.rollback = {
		required: true,
		baseline: baselineTreeSha256,
		allowlist,
		criteria: ["restore baseline tree hash", "no unrelated file changes", "repair regression checkpoints stay pass"],
		restored: true,
	};
	failure.status = "repair_queued";
	repair.action = "rollback";
	repair.repairAction = "rollback";
	repair.commands = uniqueNonEmpty(
		[...stateChangingCommands, `printf '%s\\n' 'rollback criteria: restore ${baselineTreeSha256}'`, `npm run check`],
		16,
	);
	repair.expectedArtifacts = uniqueNonEmpty([autofixArtifactPath, reportPath, baselinePath], 16);
	repair.expectedChecks = ["autofix_ready", "check:repair-rollback-policy"];
	repair.allowlist = allowlist;
	repair.rollbackCriteria = {
		baseline: baselineTreeSha256,
		mustRestore: allowlist,
		verificationCommand: "npm run check",
	};
	repair.regressionChecks = ["autofix_ready", "check:repair-rollback-policy"];
	return { failure, repair, targetRef, changedFiles };
}
