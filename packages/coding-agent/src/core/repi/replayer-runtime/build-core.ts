/** Replayer build with reverse domain next. */

import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ReplayArtifact, ReplayStep } from "../runtime-types.ts";
import { slug } from "../text.ts";
import { latestOrBuildCompiler } from "./deps.ts";
import { buildReplayMatrix, operatorFeedbackNextCommands, replayCommandConcrete } from "./pure.ts";

export function refreshReplayDerivedFields(replay: ReplayArtifact): ReplayArtifact {
	const passed = replay.executions.filter((execution: any) => execution.status === "passed").length;
	const failed = replay.executions.filter((execution: any) => execution.status === "failed").length;
	const blocked = replay.steps
		.filter((step: any) => step.status === "blocked")
		.map((step: any) => `${step.id}: ${step.reason ?? "blocked"} :: ${step.command}`);
	const readyCount = replay.steps.filter((step: any) => step.status === "ready").length;
	const nextActions = Array.from(
		new Set([
			...operatorFeedbackNextCommands(replay.operatorFeedback ?? []),
			...(readyCount ? [`re_replayer run ${replay.target ?? "<target>"} ${Math.min(readyCount, 3)}`] : []),
			...(failed ? ["re_autofix plan", "re_compiler draft", "re_verifier matrix"] : []),
			...(blocked.length
				? [
						"re_autofix plan",
						...(/reverse|native|malware|firmware|pwn|binary|technique|mitre|cwe|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
							`${replay.route ?? ""} ${replay.target ?? ""}`,
						)
							? reverseDomainCaptureNextCommands({
									routeOrBlob: `${replay.route ?? ""} ${replay.target ?? ""} blocked`,
									target: replay.target,
								})
							: ["re_operator escalate"]),
						"re_compiler draft",
					]
				: []),
			// Reverse product surface: failed/blocked reverse repro routes through shared domain capture next.
			...((failed || blocked.length) &&
			/reverse|native|malware|firmware|pwn|binary|technique|mitre|cwe|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
				`${replay.route ?? ""} ${replay.target ?? ""} ${JSON.stringify(replay.operatorFeedback ?? [])}`,
			)
				? [
						...reverseDomainCaptureNextCommands({
							routeOrBlob: `${replay.route ?? ""} ${replay.target ?? ""} ${JSON.stringify(replay.operatorFeedback ?? [])}`,
							target: replay.target,
						}),
						"re_domain_proof_exit show",
						"re_complete audit",
					]
				: []),
			"re_complete audit",
		]),
	).slice(0, 12);
	const replayMatrix = buildReplayMatrix({ ...replay, passed, failed, blocked, nextActions, replayMatrix: [] });
	return { ...replay, passed, failed, blocked, nextActions, replayMatrix };
}

export function buildReplayer(options: { target?: string; mode?: "plan" | "run" } = {}): ReplayArtifact {
	ensureReconStorage();
	const { compiler, path: compilerArtifact } = latestOrBuildCompiler(options);
	const target = options.target ?? compiler.target;
	const seen = new Set<string>();
	const steps: ReplayStep[] = [];
	for (const rawCommand of compiler.reproCommands.slice(0, 40)) {
		const command = rawCommand.trim();
		if (!command || seen.has(command)) continue;
		seen.add(command);
		const concrete = replayCommandConcrete(command, target);
		steps.push({
			id: `replay:${steps.length + 1}:${slug(command).slice(0, 24)}`,
			command: concrete.command,
			status: concrete.status ?? (concrete.blocked ? "blocked" : "ready"),
			reason: concrete.blocked,
			sourceArtifacts: compiler.sourceArtifacts,
		});
	}
	if (steps.length === 0) {
		steps.push({
			id: "replay:0:no-commands",
			command: "re_compiler draft",
			status: "blocked",
			reason: "compiler artifact has no repro_commands",
			sourceArtifacts: compiler.sourceArtifacts,
		});
	}
	return refreshReplayDerivedFields({
		timestamp: new Date().toISOString(),
		missionId: compiler.missionId,
		route: compiler.route,
		target,
		mode: options.mode ?? "plan",
		compilerArtifact,
		operatorFeedback: compiler.operatorFeedback ?? [],
		steps,
		executions: [],
		replayMatrix: [],
		passed: 0,
		failed: 0,
		blocked: [],
		nextActions: [],
		sourceArtifacts: Array.from(new Set([compilerArtifact, ...compiler.sourceArtifacts])).slice(0, 56),
	});
}
