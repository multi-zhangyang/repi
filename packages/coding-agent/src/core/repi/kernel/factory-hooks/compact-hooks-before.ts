/** session_before_compact lean checkpoint builder. */
// Landmark: repi-compaction-checkpoint lean no memory product
export function registerRepiCompactBeforeHook(pi: any, d: Record<string, any>): void {
	const buildContextPack = d.buildContextPack;
	const writeContextPackArtifact = d.writeContextPackArtifact;
	const buildReconCompactionDetails = d.buildReconCompactionDetails;
	const buildReconCompactionSummary = d.buildReconCompactionSummary;
	const buildContextEvidenceTail = d.buildContextEvidenceTail;
	const truncateMiddle = d.truncateMiddle;
	const readCurrentMission = d.readCurrentMission;

	pi.on("session_before_compact", async (event: any) => {
		const contextPack = buildContextPack({ mode: "pack" });
		const contextPath = writeContextPackArtifact(contextPack);
		const details = buildReconCompactionDetails(contextPack, contextPath);
		const summary = buildReconCompactionSummary({ event, contextPack, contextPath });
		pi.appendEntry("repi-compaction-checkpoint", {
			timestamp: Date.now(),
			tokensBefore: event.preparation.tokensBefore,
			firstKeptEntryId: event.preparation.firstKeptEntryId,
			policy: "REPI lean compaction: preserve route/mission/proof next only; no memory product tails",
			missionId: readCurrentMission()?.id ?? null,
			route: contextPack.route ?? null,
			target: contextPack.target ?? null,
			// Isolation marker only — do not embed historical evidence ledger into session entries.
			evidenceTail: truncateMiddle(buildContextEvidenceTail({ target: contextPack.target }), 400),
			contextPath,
			compactionKind: details.kind,
			resumeCommand: details.resumeCommand,
			nextCommands: Array.from(
				new Set([...(contextPack.nextCommands ?? []), "re_domain_proof_exit show", "re_complete audit"]),
			).slice(0, 10),
		});
		return {
			compaction: {
				summary,
				firstKeptEntryId: event.preparation.firstKeptEntryId,
				tokensBefore: event.preparation.tokensBefore,
				details,
			},
		};
	});
}
