/** session_compact resume contract + bounded auto-resume. */
// Landmark: repi-compaction-auto-resume triggerTurn false
export function registerRepiCompactAfterHook(
	pi: any,
	d: Record<string, any>,
	state: { compactAutoResumeBudget: number; compactAutoResumeIds: Set<string> },
): void {
	const buildReconCompactionResumeContract = d.buildReconCompactionResumeContract;
	const updateMissionCheckpoint = d.updateMissionCheckpoint;
	const buildReconCompactionAutoResume = d.buildReconCompactionAutoResume;
	const initialReconCompactionResumeTelemetry = d.initialReconCompactionResumeTelemetry;
	const writeReconCompactionResumeTelemetry = d.writeReconCompactionResumeTelemetry;
	const reconCompactionAutoResumePrompt = d.reconCompactionAutoResumePrompt;
	let compactAutoResumeBudget = state.compactAutoResumeBudget;
	const compactAutoResumeIds = state.compactAutoResumeIds;

	pi.on("session_compact", async (event: any, ctx: any) => {
		const contract = buildReconCompactionResumeContract({
			compactionEntry: event.compactionEntry,
			fromExtension: event.fromExtension,
		});
		pi.appendEntry("repi-compaction-resume-contract", contract);
		updateMissionCheckpoint(
			"compaction_resume_contract_ready",
			contract.verified ? "done" : "pending",
			contract.contextPath ?? "missing context path",
		);
		const resumeId = contract.compactionEntryId ?? `${contract.firstKeptEntryId}:${contract.tokensBefore}`;
		const canAutoResume = contract.verified && compactAutoResumeBudget > 0 && !compactAutoResumeIds.has(resumeId);
		const autoResume = buildReconCompactionAutoResume(
			contract,
			canAutoResume,
			canAutoResume
				? "verified contract; queue bounded resume turn after compaction"
				: !contract.verified
					? "contract not verified"
					: compactAutoResumeIds.has(resumeId)
						? "already triggered for compaction entry"
						: "auto-resume budget exhausted",
		);
		pi.appendEntry("repi-compaction-auto-resume", autoResume);
		const telemetry = initialReconCompactionResumeTelemetry(contract, autoResume);
		const telemetryPath = writeReconCompactionResumeTelemetry(telemetry);
		pi.appendEntry("repi-compaction-resume-telemetry", { ...telemetry, path: telemetryPath });
		if (canAutoResume) {
			compactAutoResumeIds.add(resumeId);
			compactAutoResumeBudget -= 1;
			// Queue the resume prompt as a steering message WITHOUT triggering a turn
			// (triggerTurn: false). This handler runs inside _runAutoCompaction; the
			// session's own post-compaction while-loop will resume and drain the steer
			// queue (runLoop polls getSteeringMessages at turn start), delivering the
			// resume prompt in a single, session-owned continuation. Using
			// triggerTurn: true here started a concurrent agent.continue() that raced
			// the session loop and crashed with "Agent is already processing".
			// Await to avoid a floating (un-awaited) promise.
			await pi.sendMessage(
				{
					customType: "repi-auto-resume",
					content: reconCompactionAutoResumePrompt(contract),
					display: true,
					details: autoResume,
				},
				{ deliverAs: "steer", triggerTurn: false },
			);
		}
		if (ctx.hasUI) {
			ctx.ui.setStatus(
				"repi",
				`REPI compact resume ${canAutoResume ? "triggered" : contract.verified ? "ready" : "needs review"}`,
			);
		}
	});

	state.compactAutoResumeBudget = compactAutoResumeBudget;
}
