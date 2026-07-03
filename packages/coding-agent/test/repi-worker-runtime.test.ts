import { describe, expect, it } from "vitest";
import {
	type RepiSwarmClaimLedgerEventV1,
	type RepiWorkerChildSessionRuntimeBatchV1,
	type RepiWorkerLeaseSchedulerEventV1,
	type RepiWorkerLeaseSchedulerV1,
	type RepiWorkerRuntimePoolV1,
	verifyWorkerChildSessionRuntimeBatch,
	verifyWorkerLeaseSchedulerV1,
	verifyWorkerRuntimePool,
	workerChildSessionLaunchPolicy,
	workerLeaseSchedulerEventHash,
} from "../src/core/repi/worker-runtime.ts";

const ts = "2026-07-03T00:00:00.000Z";
const sha = "a".repeat(64);

function claimEvent(type: RepiSwarmClaimLedgerEventV1["type"], claimId = "claim-a"): RepiSwarmClaimLedgerEventV1 {
	return {
		kind: "ClaimLedgerEventV1",
		seq: 1,
		prevHash: "0".repeat(64),
		eventHash: sha,
		timestamp: ts,
		source: "re_swarm",
		type,
		claimId,
		evidenceRefs: [`artifact://${type}`],
	};
}

function validPool(overrides: Partial<RepiWorkerRuntimePoolV1> = {}): RepiWorkerRuntimePoolV1 {
	return {
		kind: "WorkerRuntimePoolV1",
		schemaVersion: 1,
		poolId: "pool-a",
		maxConcurrency: 2,
		timeoutMs: 10_000,
		cancelOnTimeout: true,
		resourceBudget: { cpuSlots: 4, memoryMb: 4096, maxProcesses: 8 },
		workers: [
			{
				workerId: "w1",
				role: "native-runtime",
				route: "native",
				packetId: "packet-a",
				attempt: 1,
				maxAttempts: 3,
				retryBudget: { signature: "sig", attempt: 1, maxAttempts: 3, remaining: 2, exhausted: false },
				resourceLease: { cpuSlots: 1, memoryMb: 512, maxProcesses: 2 },
				timeoutMs: 10_000,
				status: "done",
				startedAt: ts,
				endedAt: "2026-07-03T00:00:01.000Z",
				sessionDir: "/tmp/repi/w1",
				stdoutPath: "/tmp/repi/w1/stdout.log",
				stderrPath: "/tmp/repi/w1/stderr.log",
				stdoutSha256: sha,
				stderrSha256: sha,
				toolCallDigest: sha,
				mergeKey: "claim-a",
				claimRefs: ["claim-a"],
			},
		],
		parallelGroups: [{ groupId: "g1", workers: ["w1"], dependsOn: [], maxConcurrency: 2 }],
		mergeProtocol: { strategy: "claim-aware merge", evidenceContract: [], conflicts: [] },
		claimLedgerEvents: [
			claimEvent("artifact_handoff"),
			claimEvent("claim"),
			claimEvent("validation"),
			claimEvent("challenge"),
			claimEvent("resolution"),
		],
		...overrides,
	};
}

function schedulerEvent(
	type: RepiWorkerLeaseSchedulerEventV1["type"],
	eventId: string,
	prevHash: string,
): RepiWorkerLeaseSchedulerEventV1 {
	const withoutHash = {
		kind: "WorkerLeaseSchedulerEventV1" as const,
		schemaVersion: 1 as const,
		eventId,
		ts,
		type,
		taskId: "task-a",
		workerId: "w1",
		leaseId: "lease-a",
		prevHash,
	};
	return { ...withoutHash, eventHash: workerLeaseSchedulerEventHash(withoutHash) };
}

function validScheduler(overrides: Partial<RepiWorkerLeaseSchedulerV1> = {}): RepiWorkerLeaseSchedulerV1 {
	const first = schedulerEvent("enqueue", "e1", "0".repeat(64));
	const second = schedulerEvent("lease_acquired", "e2", first.eventHash);
	const third = schedulerEvent("completed", "e3", second.eventHash);
	return {
		kind: "WorkerLeaseSchedulerV1",
		schemaVersion: 1,
		generatedAt: ts,
		schedulerId: "sched-a",
		maxConcurrency: 2,
		workerIds: ["w1", "w2"],
		tasks: [
			{
				taskId: "task-a",
				shardKey: "shard-a",
				status: "completed",
				attempt: 1,
				maxAttempts: 3,
				claimRefs: ["claim-a"],
				artifactRefs: ["artifact://stdout"],
			},
		],
		events: [first, second, third],
		assertions: {
			leaseExclusive: true,
			heartbeatRequired: true,
			staleLeaseRecovered: true,
			workStealingObserved: true,
			duplicateCompletionRejected: true,
			maxConcurrencyRespected: true,
			claimRefsPreserved: true,
			appendOnlyHashChain: true,
		},
		...overrides,
	};
}

describe("REPI worker runtime pure contracts", () => {
	it("accepts a complete worker runtime pool with claim-ledger proof chain", () => {
		const result = verifyWorkerRuntimePool(validPool());
		expect(result.ok).toBe(true);
		expect(result.evidenceContract.join("\n")).toContain(
			"artifact_handoff → claim → validation → challenge → resolution",
		);
	});

	it("rejects timeout without cancel, unresolved merge collisions, and incomplete claim refs", () => {
		const timeoutPool = validPool({
			workers: [{ ...validPool().workers[0], status: "timeout", cancelledAt: undefined }],
		});
		expect(verifyWorkerRuntimePool(timeoutPool).errors).toContain("timeout_without_cancel:w1");

		const duplicatePool = validPool({
			workers: [validPool().workers[0], { ...validPool().workers[0], workerId: "w2", sessionDir: "/tmp/repi/w2" }],
		});
		expect(verifyWorkerRuntimePool(duplicatePool).errors).toContain("duplicate_mergeKey_unresolved");

		const incompleteClaimPool = validPool({
			claimLedgerEvents: [claimEvent("artifact_handoff"), claimEvent("claim")],
		});
		expect(verifyWorkerRuntimePool(incompleteClaimPool).errors).toEqual(
			expect.arrayContaining([
				"claim_without_validation:claim-a",
				"claim_without_challenge:claim-a",
				"claim_without_resolution:claim-a",
			]),
		);
	});

	it("validates worker lease scheduler hash-chain and rejection assertions", () => {
		expect(verifyWorkerLeaseSchedulerV1(validScheduler()).ok).toBe(true);

		const prevMismatch = validScheduler({
			events: validScheduler().events.map((event, index) =>
				index === 1 ? { ...event, prevHash: "b".repeat(64) } : event,
			),
		});
		expect(verifyWorkerLeaseSchedulerV1(prevMismatch).errors).toEqual(
			expect.arrayContaining([
				"worker_lease_scheduler_prev_hash_mismatch:e2",
				"worker_lease_scheduler_event_hash_mismatch:e2",
			]),
		);

		const duplicateCompletion = validScheduler({
			events: [
				...validScheduler().events,
				schedulerEvent("completed", "e4", validScheduler().events.at(-1)?.eventHash ?? ""),
			],
		});
		expect(verifyWorkerLeaseSchedulerV1(duplicateCompletion).errors).toContain(
			"worker_lease_scheduler_duplicate_completion:task-a",
		);

		const missingAssertions = validScheduler({
			assertions: { ...validScheduler().assertions, duplicateCompletionRejected: false },
		});
		expect(verifyWorkerLeaseSchedulerV1(missingAssertions).errors).toContain(
			"worker_lease_scheduler_duplicate_completion_rejection_missing",
		);
	});

	it("builds a safe child-session launch policy and verifies child runtime wiring", () => {
		const launchPolicy = workerChildSessionLaunchPolicy({
			cwd: "/work/project",
			isolatedHome: "/tmp/repi/.repi/agent",
			timeoutMs: 60_000,
		});
		expect(launchPolicy.command).toBe("repi");
		expect(launchPolicy.args).toEqual(expect.arrayContaining(["--recon", "--worker-runtime"]));
		expect(launchPolicy.isolatedHome).toContain(".repi");
		expect(launchPolicy.isolatedHome).not.toContain("/.pi/");
		expect(launchPolicy.importPiAuth).toBe(false);
		expect(launchPolicy.updateChecksDisabled).toBe(true);
		expect(launchPolicy.telemetryDisabled).toBe(true);
		expect(launchPolicy.envDenylist).toEqual(
			expect.arrayContaining(["GITHUB_TOKEN", "ANTHROPIC_AUTH_TOKEN", "NPM_TOKEN"]),
		);

		const batch: RepiWorkerChildSessionRuntimeBatchV1 = {
			kind: "WorkerChildSessionRuntimeBatchV1",
			schemaVersion: 1,
			batchId: "batch-a",
			poolId: "pool-a",
			resourceBudget: { cpuSlots: 4, memoryMb: 4096, maxProcesses: 8 },
			launchPolicy,
			sessions: [
				{
					sessionId: "child-w1-1",
					workerId: "w1",
					packetId: "packet-a",
					attempt: 1,
					maxAttempts: 3,
					provider: {
						format: "openai-compatible",
						name: "env-provider",
						modelId: "env-model",
						baseUrlRef: "$REPI_BASE_URL",
						apiKeyRef: "$REPI_AUTH_TOKEN",
						contextWindow: 262_144,
						maxTokens: 8192,
					},
					runtime: {
						status: "passed",
						sessionDir: "/tmp/repi/w1",
						transcriptPath: "/tmp/repi/w1/transcript.jsonl",
						stdoutPath: "/tmp/repi/w1/stdout.log",
						stderrPath: "/tmp/repi/w1/stderr.log",
						startedAt: ts,
						endedAt: "2026-07-03T00:00:01.000Z",
					},
					hashes: { transcriptSha256: sha, stdoutSha256: sha, stderrSha256: sha, toolCallDigest: sha },
					resourceLease: { cpuSlots: 1, memoryMb: 512, maxProcesses: 2 },
					retryBudget: { signature: "sig", attempt: 1, maxAttempts: 3, remaining: 2, exhausted: false },
					poolBridge: {
						poolId: "pool-a",
						mergeKey: "claim-a",
						claimRefs: ["claim-a"],
						workerRuntimePoolStatus: "done",
					},
					failureRepairRefs: [],
				},
			],
			claimLedgerEvents: [
				claimEvent("artifact_handoff"),
				claimEvent("claim"),
				claimEvent("validation"),
				claimEvent("challenge"),
				claimEvent("resolution"),
			],
			poolBridge: {
				kind: "WorkerRuntimePoolV1Bridge",
				poolId: "pool-a",
				workerIds: ["w1"],
				claimAwareMerge: true,
				childSessionRuntimeCaptured: true,
			},
		};
		expect(verifyWorkerChildSessionRuntimeBatch(batch)).toEqual({ ok: true, errors: [] });
		expect(
			verifyWorkerChildSessionRuntimeBatch({
				...batch,
				sessions: [
					{ ...batch.sessions[0], provider: { ...batch.sessions[0].provider, apiKeyRef: "literal-secret" } },
				],
			}).errors,
		).toContain("child_session_literal_api_key:child-w1-1");
	});
});
