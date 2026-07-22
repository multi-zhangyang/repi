/** Wire-proof: verifier/compiler/autofix/repair bags. */

import { latestScopedMarkdownArtifact } from "../artifact-scope.ts";
import { configureAutofix, latestOrBuildReplay, writeAutofixRepairRollbackPolicy } from "../autofix.ts";
import {
	configureCompilerRuntime,
	formatStrictClaimCheckSnapshot,
	latestCompilerArtifactPath,
	parseCompilerArtifact,
} from "../compiler-runtime.ts";
import { appendEvidence } from "../evidence.ts";
import { appendRuntimeFailureRepairFromAutofix, buildRuntimeFailureRepair } from "../failure-repair.ts";
import { appendJournal } from "../journal.ts";
import { appendAutofixMemoryEvent } from "../memory-events.ts";
import { updateMissionCheckpoint } from "../mission.ts";
import { bootstrapToolFromCommand, operatorFeedbackNextCommands } from "../operator-runtime.ts";
import { configureRepairRollback } from "../repair-rollback.ts";
import { evidenceLedgerPath, reportDir } from "../storage.ts";
import { configureVerifierRuntime } from "../verifier-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProofRuntimeCoreModules(pick: PickFn): void {
	configureVerifierRuntime({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});

	configureCompilerRuntime({
		appendEvidence: pick("appendEvidence", appendEvidence),
		evidenceLedgerPath: pick("evidenceLedgerPath", evidenceLedgerPath),
		formatStrictClaimCheckSnapshot: pick("formatStrictClaimCheckSnapshot", formatStrictClaimCheckSnapshot),
		operatorFeedbackNextCommands: pick("operatorFeedbackNextCommands", operatorFeedbackNextCommands),
		reportDir: pick("reportDir", reportDir),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});

	configureAutofix({
		latestOrBuildReplay: pick("latestOrBuildReplay", latestOrBuildReplay),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		parseCompilerArtifact: pick("parseCompilerArtifact", parseCompilerArtifact),
		operatorFeedbackNextCommands: pick("operatorFeedbackNextCommands", operatorFeedbackNextCommands),
		bootstrapToolFromCommand: pick("bootstrapToolFromCommand", bootstrapToolFromCommand),
		appendJournal: pick("appendJournal", appendJournal),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		appendEvidence: pick("appendEvidence", appendEvidence),
		appendAutofixMemoryEvent: pick("appendAutofixMemoryEvent", appendAutofixMemoryEvent),
		appendRuntimeFailureRepairFromAutofix: pick(
			"appendRuntimeFailureRepairFromAutofix",
			appendRuntimeFailureRepairFromAutofix,
		),
		writeAutofixRepairRollbackPolicy: pick("writeAutofixRepairRollbackPolicy", writeAutofixRepairRollbackPolicy),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
	});

	configureRepairRollback({
		buildRuntimeFailureRepair: pick("buildRuntimeFailureRepair", buildRuntimeFailureRepair),
	});
}
