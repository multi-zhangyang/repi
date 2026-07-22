/** Completion audit: context pack / supervisor / swarm claim gates. */
import {
	latestContextPackArtifactPath,
	latestSupervisorArtifactPath,
	latestSwarmArtifactPath,
	parseContextPackArtifact,
	parseSupervisorArtifact,
	parseSwarmArtifact,
	strictClaimCheckSnapshot,
	structuredClaimMergeCheckFromSwarm,
	verifyCompactionResumeLedger,
	verifyContextPackResume,
} from "./deps.ts";

export function auditCompletionContextGates(blockers: string[], warnings: string[]): void {
	const contextPath = latestContextPackArtifactPath();
	const contextPack = contextPath ? parseContextPackArtifact(contextPath) : undefined;
	if (contextPack && contextPath) {
		const ledgerVerification = verifyCompactionResumeLedger();
		if (ledgerVerification.status === "corrupt") {
			for (const row of ledgerVerification.blocked.slice(0, 8)) blockers.push(row);
		}
		if (ledgerVerification.status === "pass")
			warnings.push(`compaction resume ledger verified: ${ledgerVerification.rows} row(s)`);
		const contextVerification = verifyContextPackResume(
			contextPack,
			contextPath,
			contextPack.resumedFromContextPath ? "contextPath" : "latest",
			contextPack.target,
		);
		const isResumeContract = contextPack.mode === "resume" || Boolean(contextPack.resumedFromContextPath);
		if (contextPack.closure?.status === "blocked" || contextPack.closure?.status === "exhausted") {
			blockers.push(`context resume closure blocks completion: ${contextPack.closure.status} (${contextPath})`);
		}
		if (isResumeContract && contextPack.resumeQueueStatus !== "done") {
			blockers.push(`context resume queue not done: ${contextPack.resumeQueueStatus ?? "missing"} (${contextPath})`);
		}
		if (isResumeContract && contextPack.closure?.status !== "closed") {
			blockers.push(
				`context resume closure not closed: ${contextPack.closure?.status ?? "missing"} (${contextPath})`,
			);
		}
		for (const row of contextVerification.blocked.slice(0, 8)) {
			const message = `context resume verification blocks completion: ${row}`;
			if (isResumeContract) blockers.push(message);
			else warnings.push(message);
		}
		if (!isResumeContract && contextPack.closure?.status === "open") {
			warnings.push(`context pack open (refresh optional): ${contextPath}`);
		}
	}
	const supervisorPath = latestSupervisorArtifactPath();
	const supervisor = supervisorPath ? parseSupervisorArtifact(supervisorPath) : undefined;
	if (supervisor) {
		if (supervisor.supervisorVerdict !== "pass") {
			blockers.push(`supervisor verdict blocks final claim: ${supervisor.supervisorVerdict} (${supervisorPath})`);
		}
		for (const row of (supervisor.planCoverage ?? [])
			.filter((item: any) => /worker_binding=fail|parallel_plan=missing|\bmissing=[1-9]/i.test(item))
			.slice(0, 8)) {
			blockers.push(`supervisor plan coverage gap: ${row}`);
		}
		for (const row of (supervisor.claimCheckPolicy ?? [])
			.filter((item: any) => /worker_binding=(?!pass)|plan_contract_gaps=[1-9]|parallel_plan_id=missing/i.test(item))
			.slice(0, 8)) {
			blockers.push(`supervisor claim checkpoint blocks final claim: ${row}`);
		}
		const supervisorStrict = supervisor.strictClaimCheck ?? strictClaimCheckSnapshot();
		if (supervisorStrict.status !== "pass") {
			blockers.push(
				`supervisor strict claim checkpoint blocks final claim: ${supervisorStrict.status} (${supervisorStrict.markerPath ?? "missing marker"})`,
			);
			for (const gap of supervisorStrict.requiredGaps.slice(0, 8))
				blockers.push(`strict claim required gap: ${gap}`);
		}
		for (const row of (supervisor.claimCheckResult ?? [])
			.filter((item: any) =>
				/final_publish_ready=no|strict_status=(?:blocked|missing)|required_gaps=[1-9]/i.test(item),
			)
			.slice(0, 8)) {
			blockers.push(`supervisor claim checkpoint result blocks final claim: ${row}`);
		}
	}
	const swarmPath = latestSwarmArtifactPath();
	const swarm = swarmPath ? parseSwarmArtifact(swarmPath) : undefined;
	if (swarm) {
		for (const row of (swarm.planCoverage ?? [])
			.filter((item: any) => /worker_binding=fail|parallel_plan=missing|\bmissing=[1-9]/i.test(item))
			.slice(0, 8)) {
			blockers.push(`swarm plan coverage gap: ${row}`);
		}
		for (const row of (swarm.executionAudit ?? [])
			.filter((item: any) => /status=(?:pending_execution|needs_repair|needs_evidence)/i.test(item))
			.slice(0, 8)) {
			blockers.push(`swarm execution audit gap: ${row}`);
		}
		if ((swarm.releaseCheckMetadata ?? []).length && !supervisor) {
			blockers.push(`swarm release checkpoint metadata has no supervisor review: ${swarmPath}`);
		}
		for (const row of (swarm.releaseCheckMetadata ?? [])
			.filter((item: any) =>
				/claim_check_verdict=blocked|release_blocking_gaps=[1-9]|required_platform_gaps=[1-9]|unresolved_frontier_gaps=[1-9]|blocked_until_supervisor_claim_check_passes/i.test(
					item,
				),
			)
			.slice(0, 8)) {
			blockers.push(`swarm release checkpoint blocks final claim: ${row}`);
		}
		const structuredClaimMergeCheck = structuredClaimMergeCheckFromSwarm(swarm);
		if (structuredClaimMergeCheck.status === "blocked") {
			blockers.push(
				`swarm structured claim merge blocks final claim: ${structuredClaimMergeCheck.mergePath ?? swarmPath ?? "missing merge path"}`,
			);
			for (const error of structuredClaimMergeCheck.errors.slice(0, 8))
				blockers.push(`structured claim merge error: ${error}`);
		}
	}
}
