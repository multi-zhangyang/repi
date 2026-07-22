/** Failure-repair domain appenders with reverse domain next. */

import { latestAutofixArtifactPath } from "../autofix/helpers.ts";
import { runtimeFailureCommandTarget } from "../repair-rollback-core.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ReplayArtifact } from "../runtime-types/verifier-replay.ts";
import { slug, truncateMiddle } from "../text.ts";
import { runtimeFailureCategory } from "./classify.ts";
import { appendRuntimeFailureInputs } from "./ledger-append.ts";
import type { RuntimeFailureRepairInput } from "./types.ts";

export function appendRuntimeFailureRepairFromReplay(replay: ReplayArtifact, path: string): void {
	if (replay.mode !== "run" || (replay.failed === 0 && replay.blocked.length === 0)) return;
	const targetRef = runtimeFailureCommandTarget(replay.target);
	const sourceArtifacts = [path, replay.compilerArtifact, ...replay.sourceArtifacts].filter(Boolean) as string[];
	const inputs: RuntimeFailureRepairInput[] = [];
	for (const execution of replay.executions.filter((item: any) => item.status === "failed").slice(0, 16)) {
		const reason = `replay failed: ${execution.stepId} exit=${execution.exit} killed=${execution.killed === true} command=${execution.command} stdout_sha256=${execution.stdoutHash} stderr_sha256=${execution.stderrHash} stderr=${truncateMiddle(execution.stderrHead, 260)}`;
		inputs.push({
			source: "re_replayer",
			scope: `${replay.target ?? replay.route ?? replay.missionId ?? "replay"}:${execution.stepId}`,
			target: replay.target,
			reason,
			category: runtimeFailureCategory(reason),
			status: "failed",
			commands: [
				`re_autofix plan ${targetRef}`,
				`re_replayer run ${targetRef} 1`,
				...reverseDomainCaptureNextCommands({ routeOrBlob: `${targetRef} ${reason}`, target: targetRef }),
				"re_domain_proof_exit show",
				"re_complete audit",
			],
			failedChecks: ["replay_ready", "autofix_ready", "reverse_proof_exit"],
			sourceArtifacts,
			expectedArtifacts: [path, latestAutofixArtifactPath()].filter(Boolean) as string[],
		});
	}
	for (const blocked of replay.blocked.slice(0, 16)) {
		const command = /::\s*(.+)$/.exec(blocked)?.[1]?.trim();
		inputs.push({
			source: "re_replayer",
			scope: `${replay.target ?? replay.route ?? replay.missionId ?? "replay"}:blocked:${slug(blocked).slice(0, 24)}`,
			target: replay.target,
			reason: `replay blocked: ${blocked}`,
			category: runtimeFailureCategory(blocked),
			status: "blocked",
			commands: [
				`re_autofix plan ${targetRef}`,
				...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					`${targetRef} ${command ?? ""} ${blocked}`,
				)
					? reverseDomainCaptureNextCommands({
							routeOrBlob: `${targetRef} ${command ?? ""} ${blocked}`,
							target: targetRef,
						})
					: [command ? `re_operator plan ${targetRef}` : `re_operator escalate ${targetRef}`]),
				"re_domain_proof_exit show",
			],
			failedChecks: ["replay_ready", "operator_queue_ready", "reverse_proof_exit"],
			sourceArtifacts,
			expectedArtifacts: [path, latestAutofixArtifactPath()].filter(Boolean) as string[],
			unblock: command ?? `re_autofix plan ${targetRef}`,
		});
	}
	appendRuntimeFailureInputs(inputs);
}
