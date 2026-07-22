import type { DelegateWorker } from "../operator-format-types.ts";
import type { SwarmRuntimeModelSummary, SwarmRuntimeRetryBudget, SwarmRuntimeState } from "../swarm-exec.ts";

/** Runtime types: swarm subagent manifest. */

export type SwarmSubagentRuntimeManifestV1 = {
	kind: "SubagentRuntimeManifestV1";
	schemaVersion: 1;
	runId: string;
	roleId: DelegateWorker;
	workerId: string;
	attempt: number;
	status: SwarmRuntimeState;
	pid: number | null;
	parentPid: number | null;
	sessionDir: string;
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	startedAt: string;
	endedAt: string;
	elapsedMs: number;
	exitCode: number | null;
	signal: string | null;
	model: SwarmRuntimeModelSummary;
	toolCallDigest: string;
	claimLedgerPath: string;
	failureLedgerPath: string;
	repairQueuePath: string;
	resourceLimits: {
		timeoutMs: number;
		maxCommands: number;
		maxOutputBytes: number;
		cancelOnTimeout: boolean;
	};
	retryBudget: SwarmRuntimeRetryBudget;
	mergeKeys: string[];
	evidenceRefs: string[];
};

export type SwarmSubagentRuntimeManifestRow = SwarmSubagentRuntimeManifestV1 & {
	runtimeManifestFile: string;
};
