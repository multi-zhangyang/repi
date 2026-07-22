/** Failure-repair domain appenders with reverse domain next. */

import { runtimeFailureCommandTarget } from "../repair-rollback-core.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { slug } from "../text.ts";
import { runtimeFailureCategory } from "./classify.ts";
import { appendRuntimeFailureInputs } from "./ledger-append.ts";
import type { RuntimeFailureRepairInput } from "./types.ts";

export function appendRuntimeFailureRepairFromAutofix(autofix: any, path: string): void {
	const targetRef = runtimeFailureCommandTarget(autofix.target);
	const sourceArtifacts = [path, autofix.replayArtifact, autofix.compilerArtifact, ...autofix.sourceArtifacts].filter(
		Boolean,
	) as string[];
	const queuedCommands = [
		...autofix.patchQueue,
		...autofix.commandSubstitutions,
		...autofix.bootstrapQueue,
		...autofix.evidenceRecaptureQueue,
	].map((item: any) => item.command);
	const inputs: RuntimeFailureRepairInput[] = [];
	for (const failure of autofix.failures.slice(0, 16)) {
		inputs.push({
			source: "re_autofix",
			scope: `${autofix.target ?? autofix.route ?? autofix.missionId ?? "autofix"}:failure:${slug(failure).slice(0, 24)}`,
			target: autofix.target,
			reason: `autofix queued repair for replay/compiler failure: ${failure}`,
			category: runtimeFailureCategory(failure),
			status: "repair_queued",
			commands: queuedCommands.length ? queuedCommands.slice(0, 8) : [`re_operator escalate ${targetRef}`],
			failedChecks: ["autofix_ready", "replay_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, autofix.replayArtifact].filter(Boolean) as string[],
		});
	}
	for (const item of [
		...autofix.patchQueue,
		...autofix.commandSubstitutions,
		...autofix.bootstrapQueue,
		...autofix.evidenceRecaptureQueue,
	]
		.filter((entry: any) => entry.status === "blocked")
		.slice(0, 16)) {
		inputs.push({
			source: "re_autofix",
			scope: `${autofix.target ?? autofix.route ?? autofix.missionId ?? "autofix"}:${item.id}`,
			target: autofix.target,
			reason: `autofix item blocked: ${item.kind} ${item.reason}; command=${item.command}`,
			category: runtimeFailureCategory(`${item.reason} ${item.command}`),
			status: "blocked",
			commands: [
				item.command,
				...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					`${targetRef} ${item.kind} ${item.reason} ${item.command}`,
				)
					? reverseDomainCaptureNextCommands({
							routeOrBlob: `${targetRef} ${item.kind} ${item.reason} ${item.command}`,
							target: targetRef,
						})
					: [`re_operator escalate ${targetRef}`]),
			],
			failedChecks: ["autofix_ready", "operator_queue_ready"],
			sourceArtifacts: [path, ...item.sourceArtifacts, ...sourceArtifacts],
			expectedArtifacts: [path, autofix.replayArtifact].filter(Boolean) as string[],
		});
	}
	appendRuntimeFailureInputs(inputs);
}
