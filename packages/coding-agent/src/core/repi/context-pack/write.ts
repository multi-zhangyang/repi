/** Context-pack: writeContextPackArtifact. */

import { ensureReconStorage } from "../resources.ts";
import { appendPrivateTextFile, writePrivateTextFile } from "../storage.ts";
import { appendEvidence, rotateCompactionResumeLedgerIfNeeded, updateMissionCheckpoint } from "./deps.ts";
import { contextPackArtifactPathFor, contextPackSha256 } from "./index.ts";
import type { ContextPackArtifact } from "./types.ts";
import { buildContextPackMarkdown } from "./write-markdown.ts";
import { withContextPackWriteReverseNext } from "./write-reverse.ts";

export function writeContextPackArtifact(pack: ContextPackArtifact): string {
	ensureReconStorage();
	pack = withContextPackWriteReverseNext(pack);
	const path = pack.contextPath ?? contextPackArtifactPathFor(pack);
	pack.contextPath = path;
	if (pack.resumeContract) {
		pack.resumeContract.contextPath = path;
		pack.resumeContract.resumeQueueStatus = pack.resumeQueueStatus ?? pack.resumeContract.resumeQueueStatus;
		if (pack.closure) pack.resumeContract.closure = pack.closure;
	}
	pack.contextSha256 = contextPackSha256(pack);
	if (pack.resumeContract) pack.resumeContract.contextSha256 = pack.contextSha256;
	writePrivateTextFile(path, buildContextPackMarkdown(pack, path));
	if (pack.compactionLedger) {
		appendPrivateTextFile(
			pack.compactionLedger.path,
			`${JSON.stringify({
				ts: pack.timestamp,
				contractId: pack.contractId,
				contextPath: pack.contextPath,
				contextSha256: pack.contextSha256,
				idempotencyKey: pack.idempotencyKey,
				resumeQueueStatus: pack.resumeQueueStatus,
				prevHash: pack.compactionLedger.prevHash,
				entryHash: pack.compactionLedger.entryHash,
			})}\n`,
		);
		rotateCompactionResumeLedgerIfNeeded();
	}
	appendEvidence({
		kind: "artifact",
		title: `context-pack-${pack.mode} ${pack.missionId ?? "no-mission"}`,
		fact: `Context pack captured ${pack.artifactIndex.length} artifact(s), ${pack.repairQueue.length} repair item(s), ${pack.nextCommands.length} next command(s), context_sha256=${pack.contextSha256 ?? "missing"}, artifact_scope_blocked=${pack.artifactScopeFilter?.blockedArtifactCount ?? 0}, memory_orchestrator=${pack.memoryOrchestrator?.phase ?? "missing"}`,
		command: `re_context ${pack.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "mission/evidence/memory resume context",
	});
	updateMissionCheckpoint("context_pack_ready", "done", path);
	return path;
}
