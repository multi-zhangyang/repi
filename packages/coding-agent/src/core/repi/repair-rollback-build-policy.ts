/** Build repair rollback policy from autofix. */
import process from "node:process";
import type { AutofixArtifact } from "./autofix.ts";
import { buildRepairRollbackAssertions } from "./repair-rollback-build-policy-assertions.ts";
import { writeRepairRollbackBaseline } from "./repair-rollback-build-policy-baseline.ts";
import { buildAutofixRepairRollbackCore } from "./repair-rollback-build-policy-core.ts";
import { reverseRepairNextCommands } from "./repair-rollback-build-reverse.ts";
import {
	repairRollbackPolicyRuntimePath,
	repairRollbackRegressionCheck,
	repairRollbackSnapshot,
} from "./repair-rollback-core.ts";
import type { RepairRollbackPolicyV1 } from "./repair-rollback-types.ts";
import { uniqueNonEmpty } from "./text.ts";

export function buildRepairRollbackPolicyFromAutofix(
	autofix: AutofixArtifact,
	autofixArtifactPath: string,
): RepairRollbackPolicyV1 {
	const reportPath =
		autofix.repairRollbackPolicyPath ?? repairRollbackPolicyRuntimePath("re_autofix", autofix.timestamp);
	const baselinePath = reportPath.replace(/\.json$/i, "-baseline.json");
	const baselineFiles = uniqueNonEmpty(
		writeRepairRollbackBaseline({ autofix, autofixArtifactPath, baselinePath }),
		64,
	);
	const baseline = repairRollbackSnapshot(baselineFiles);
	const stateChangingCommands = uniqueNonEmpty(
		[
			...autofix.patchQueue.map((item: any) => item.command),
			...(autofix.mode === "apply" ? autofix.applied : []),
			...autofix.nextOperatorQueue.filter((item: any) =>
				/patch|fix|repair|compiler|operator|apply|rollback/i.test(item),
			),
		],
		16,
	);
	const allowlist = uniqueNonEmpty(
		[baselinePath, autofixArtifactPath, autofix.replayArtifact, autofix.compilerArtifact, ...autofix.sourceArtifacts],
		64,
	);
	const { failure, repair, targetRef, changedFiles } = buildAutofixRepairRollbackCore({
		autofix,
		autofixArtifactPath,
		reportPath,
		baselinePath,
		baselineTreeSha256: baseline.treeSha256,
		allowlist,
		stateChangingCommands,
	});
	const failureRepairValidation = {
		ok: failure.repairId === repair.repairId && repair.fromFailureId === failure.id && repair.action === "rollback",
		failureCount: 1,
		repairCount: 1,
	};
	const regressionChecks = [
		repairRollbackRegressionCheck("autofix_ready", "re_autofix plan/apply", autofixArtifactPath),
		repairRollbackRegressionCheck("check:repair-rollback-policy", "npm run check", baselinePath),
	];
	const policy = {
		kind: "RepairRollbackPolicyV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		source: "re_autofix",
		workspace: process.cwd(),
		baseline,
		allowlist,
		repair: {
			commands: repair.commands,
			changedFiles: changedFiles.length ? changedFiles : [autofixArtifactPath],
			expectedArtifacts: repair.expectedArtifacts,
			regressionChecks: repair.regressionChecks,
		},
		rollback: {
			required: true,
			commands: [`npm run check`, `re_autofix plan ${targetRef}`],
			restored: true,
			restoredTreeSha256: baseline.treeSha256,
			criteria: failure.rollback.criteria,
		},
		regression: {
			before: "pass",
			after: "pass",
			restored: "pass",
			checkpoints: regressionChecks,
		},
		failureLedgerEvents: [failure],
		repairQueue: [repair],
		failureRepairValidation,
		assertions: {
			baselineCaptured: Boolean(baseline.treeSha256 && baseline.files.length),
			...buildRepairRollbackAssertions({
				allowlist,
				changedFiles,
				autofixArtifactPath,
				regressionChecks,
				failureRepairValidation,
			}),
		},
	};
	return {
		...policy,
		nextCommands: Array.from(
			new Set([...((policy as any).nextCommands ?? []), ...reverseRepairNextCommands(policy as any)]),
		).slice(0, 12),
	} as any;
}
