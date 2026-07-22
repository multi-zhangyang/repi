/** Wire compact-resume configure bag. */

import { configureCompactResume } from "../compact-resume.ts";
import { contextPackSha256 } from "../context-pack.ts";
import {
	appendCompactResumeTransition,
	buildCompactResumeLedgerV2Report,
	compactResumeAttemptForKey,
	contextBranchId,
	normalizeReconCommand,
	readCompactResumeTransitions,
} from "../memory-stubs.ts";
import { updateMissionCheckpoint } from "../mission.ts";
import { caseMemoryLanePlanLines } from "../proof-loop-runtime.ts";
import { compactionResumeTelemetryPath } from "../storage.ts";
import { hashFileSha256, interestingLines } from "../text.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireCompactResumeConfigure(pick: PickFn): void {
	configureCompactResume({
		appendCompactResumeTransition: pick("appendCompactResumeTransition", appendCompactResumeTransition),
		buildCompactResumeLedgerV2Report: pick("buildCompactResumeLedgerV2Report", buildCompactResumeLedgerV2Report),
		caseMemoryLanePlanLines: pick("caseMemoryLanePlanLines", caseMemoryLanePlanLines),
		compactResumeAttemptForKey: pick("compactResumeAttemptForKey", compactResumeAttemptForKey),
		compactionResumeTelemetryPath: pick("compactionResumeTelemetryPath", compactionResumeTelemetryPath),
		contextBranchId: pick("contextBranchId", contextBranchId),
		contextPackSha256: pick("contextPackSha256", contextPackSha256),
		hashFileSha256: pick("hashFileSha256", hashFileSha256),
		interestingLines: pick("interestingLines", interestingLines),
		normalizeReconCommand: pick("normalizeReconCommand", normalizeReconCommand),
		readCompactResumeTransitions: pick("readCompactResumeTransitions", readCompactResumeTransitions),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
	});
}
