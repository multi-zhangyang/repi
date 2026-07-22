/** Build runtime failure + repair pair. */

import { runtimeFailureCommandTarget } from "../proof-loop-core/deps-run.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import {
	failureToRepair,
	runtimeArtifactHashes,
	runtimeFailureAttempt,
	runtimeFailureCategory,
	runtimeFailureSignature,
	runtimeRepairAction,
} from "./classify.ts";
import { failureRepairEvidenceWriteback } from "./ledger.ts";
import type { RuntimeFailureRepairInput, RuntimeFailureStatus } from "./types.ts";

export function buildRuntimeFailureRepair(input: RuntimeFailureRepairInput): {
	failure: any;
	repair: any;
} {
	const category = input.category ?? runtimeFailureCategory(input.reason);
	const action = runtimeRepairAction(category, input.reason);
	const command = input.commands?.[0];
	const signature = runtimeFailureSignature({ scope: input.scope, category, command, reason: input.reason });
	const attempt = runtimeFailureAttempt(signature);
	const maxAttempts = Math.max(1, input.maxAttempts ?? 3);
	const exhausted = attempt >= maxAttempts && input.status !== "blocked";
	const status: RuntimeFailureStatus = exhausted ? "exhausted" : (input.status ?? "repair_queued");
	const artifacts = runtimeArtifactHashes(input.sourceArtifacts);
	const artifactHashes = artifacts.map((artifact: any) => ({ path: artifact.path, sha256: artifact.sha256 }));
	const repairId = `repair:runtime:${signature.slice(0, 16)}`;
	const id = `fail:runtime:${signature.slice(0, 16)}:${attempt}`;
	const exhaustedAction = `re_operator escalate ${runtimeFailureCommandTarget(input.target)}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|technique|gdb|frida|r2/i.test(
			`${input.reason ?? ""} ${input.scope ?? ""} ${input.target ?? ""} ${(input.commands ?? []).join(" ")} ${(input.failedChecks ?? []).join(" ")}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${input.reason ?? ""} ${input.scope ?? ""} ${input.target ?? ""} failure_repair`,
				target: input.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const budget = {
		retryKey: signature,
		remainingAttempts: Math.max(0, maxAttempts - attempt),
		exhaustedAction,
	};
	const evidenceWriteback = failureRepairEvidenceWriteback();
	const blockedConditions = [
		{ reason: input.reason, unblock: input.unblock ?? (input.commands?.[0] || exhaustedAction) },
	];
	const rollback = {
		required: false,
		baseline: artifactHashes[0]?.sha256 ?? "none",
		allowlist: input.sourceArtifacts.filter(Boolean).slice(0, 12),
		criteria: input.failedChecks,
		restored: false,
	};
	const failure: any = {
		id,
		ts: new Date().toISOString(),
		source: input.source,
		scope: input.scope,
		category,
		signature,
		attempt,
		maxAttempts,
		status,
		failedChecks: input.failedChecks,
		artifacts,
		artifactHashes,
		repairId,
		budget,
		retryBudget: budget,
		evidenceWriteback,
		blockedConditions,
		rollback,
	};
	const commands = Array.from(
		new Set([...(reverseNext ?? []), ...(input.commands?.filter(Boolean) ?? [exhaustedAction])]),
	).slice(0, 12);
	const repair: any = failureToRepair(
		failure,
		commands.length ? commands : [exhaustedAction],
		action,
		input.failedChecks,
		input.expectedArtifacts ?? input.sourceArtifacts.filter(Boolean),
	);
	return { failure, repair };
}
