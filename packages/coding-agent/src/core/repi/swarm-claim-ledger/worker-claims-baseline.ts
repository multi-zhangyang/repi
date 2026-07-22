/** Append baseline handoff/validation events for a worker claim. */

import { appendSwarmClaimLedgerEvent, runtimeArtifactHashes } from "./pure.ts";
import type { SwarmClaimLedgerEventV1, SwarmClaimLedgerInput } from "./types.ts";
import type { WorkerClaimContext } from "./worker-claims-context.ts";

export function appendWorkerClaimBaselineEvents(input: {
	events: SwarmClaimLedgerEventV1[];
	swarm: SwarmClaimLedgerInput;
	worker: any;
	scope: string;
	timestamp: string;
	ctx: WorkerClaimContext;
}): void {
	const { events, swarm, worker, scope, timestamp, ctx } = input;
	const {
		executions,
		runtimeManifests,
		runtimeManifestRefs,
		blocked,
		coverageRows,
		missingCoverageRows,
		auditRows,
		claimPassed,
		reverseGate,
		claimId,
	} = ctx;
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "artifact_handoff",
			claimId,
			workerId: worker.id,
			role: worker.worker,
			scope,
			statement:
				"worker packet handoff binds commands, dependencies, merge keys, and evidence contract before execution.",
			evidenceRefs: [swarm.delegationArtifact, ...worker.sourceArtifacts, ...runtimeManifestRefs].filter(
				(item): item is string => Boolean(item),
			),
			artifactHashes: runtimeArtifactHashes([
				swarm.delegationArtifact,
				...worker.sourceArtifacts,
				...runtimeManifestRefs,
			]),
			metadata: {
				objective: worker.objective,
				commands: worker.commands,
				dependencies: worker.dependencies,
				mergeKeys: worker.mergeKeys,
				evidenceContract: worker.evidenceContract,
				runtimeManifestFiles: runtimeManifests.map((manifest: any) => manifest.runtimeManifestFile),
			},
		},
		timestamp,
	);
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "claim",
			claimId,
			workerId: worker.id,
			role: worker.worker,
			scope,
			status: claimPassed ? "proven" : executions.length ? "gap" : "pending",
			statement: claimPassed
				? "worker claim is artifact-backed and coverage-complete for this swarm run."
				: "worker claim is not promotable until runtime execution, coverage, and repair checkpoints close.",
			evidenceRefs: [
				swarm.delegationArtifact,
				...worker.sourceArtifacts,
				...executions.flatMap((execution: any) => execution.sourceArtifacts),
				...runtimeManifestRefs,
			].filter((item): item is string => Boolean(item)),
			artifactHashes: runtimeArtifactHashes([
				swarm.delegationArtifact,
				...worker.sourceArtifacts,
				...executions.flatMap((execution: any) => execution.sourceArtifacts),
				...runtimeManifestRefs,
			]),
			metadata: {
				workerStatus: worker.status,
				executions: executions.length,
				runtimeManifests: runtimeManifests.length,
				blocked: blocked.length,
				coverageRows: coverageRows.length,
				missingCoverageRows: missingCoverageRows.length,
				reverseProofExit: reverseGate.proofExit,
				reverseBindReady: reverseGate.bindReady,
				reverseBlocked: reverseGate.blocked,
				reverseReasons: reverseGate.reasons,
			},
		},
		timestamp,
	);
	appendSwarmClaimLedgerEvent(
		events,
		{
			type: "validation",
			claimId,
			workerId: worker.id,
			role: "supervisor",
			scope,
			status: claimPassed ? "pass" : "fail",
			statement:
				"runtime coverage validation checks execution status, blocked rows, and evidence-contract coverage.",
			evidenceRefs: [swarm.delegationArtifact, ...worker.sourceArtifacts, ...runtimeManifestRefs].filter(
				(item): item is string => Boolean(item),
			),
			metadata: {
				auditRows,
				coverageRows,
				missingCoverageRows,
				runtimeManifestFiles: runtimeManifests.map((manifest: any) => manifest.runtimeManifestFile),
				blockedCommands: blocked.map((execution: any) => execution.command),
			},
		},
		timestamp,
	);
}
