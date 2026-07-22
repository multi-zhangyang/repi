/** Wire-proof: configureCompletionAudit bag. */

import { strictClaimCheckSnapshot } from "../claim-release.ts";
import { latestReconCompactionResumeTelemetry, verifyContextPackResume } from "../compact-resume.ts";
import { latestCompilerArtifactPath, parseCompilerArtifact } from "../compiler-runtime.ts";
import { configureCompletionAudit } from "../completion-audit.ts";
import { latestContextPackArtifactPath, parseContextPackArtifact } from "../context-pack.ts";
import { formatDomainProofExitClosure } from "../domain-proof-exit.ts";
import { buildEvidenceDigest } from "../evidence.ts";
import { parseSwarmArtifact } from "../graph-artifacts.ts";
import { appendCompletionMemoryEvent } from "../memory-events.ts";
import { verifyCompactionResumeLedger } from "../memory-stubs.ts";
import { formatMission, readCurrentMission, updateMissionCheckpoint } from "../mission.ts";
import { structuredClaimMergeCheckFromSwarm } from "../structured-claim-merge.ts";
import { latestSupervisorArtifactPath, parseSupervisorArtifact } from "../supervisor.ts";
import { latestSwarmArtifactPath } from "../swarm-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProofCompletionAuditModules(pick: PickFn): void {
	configureCompletionAudit({
		appendCompletionMemoryEvent: pick("appendCompletionMemoryEvent", appendCompletionMemoryEvent),
		buildEvidenceDigest: pick("buildEvidenceDigest", buildEvidenceDigest),
		formatDomainProofExitClosure: pick("formatDomainProofExitClosure", formatDomainProofExitClosure),
		formatMission: pick("formatMission", formatMission),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		latestContextPackArtifactPath: pick("latestContextPackArtifactPath", latestContextPackArtifactPath),
		latestReconCompactionResumeTelemetry: pick(
			"latestReconCompactionResumeTelemetry",
			latestReconCompactionResumeTelemetry,
		),
		latestSupervisorArtifactPath: pick("latestSupervisorArtifactPath", latestSupervisorArtifactPath),
		latestSwarmArtifactPath: pick("latestSwarmArtifactPath", latestSwarmArtifactPath),
		parseCompilerArtifact: pick("parseCompilerArtifact", parseCompilerArtifact),
		parseContextPackArtifact: pick("parseContextPackArtifact", parseContextPackArtifact),
		parseSupervisorArtifact: pick("parseSupervisorArtifact", parseSupervisorArtifact),
		parseSwarmArtifact: pick("parseSwarmArtifact", parseSwarmArtifact),
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		strictClaimCheckSnapshot: pick("strictClaimCheckSnapshot", strictClaimCheckSnapshot),
		structuredClaimMergeCheckFromSwarm: pick(
			"structuredClaimMergeCheckFromSwarm",
			structuredClaimMergeCheckFromSwarm,
		),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		verifyCompactionResumeLedger: pick("verifyCompactionResumeLedger", verifyCompactionResumeLedger),
		verifyContextPackResume: pick("verifyContextPackResume", verifyContextPackResume),
	});
}
