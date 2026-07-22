import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { prioritizeReverseProofLines } from "../reverse-capture.ts";
import {
	type NativeRuntimeArtifact,
	type NativeRuntimeExecution,
	nativeRuntimePlanMatrices,
} from "../reverse-runtime.ts";
import { evidenceMapsDir, evidenceRunsDir, recentMarkdownArtifacts } from "../storage.ts";
import { latestExploitLabArtifactPath } from "./exploit-pure-path.ts";
import { inferNativeRuntimeTarget, latestNativeRuntimeArtifactPath } from "./native-pure-path.ts";
import { latestCompilerArtifactPath, latestReplayerArtifactPath, latestVerifierArtifactPath } from "./shared.ts";
export { latestNativeRuntimeArtifactPath, inferNativeRuntimeTarget };

export function buildNativeRuntimeArtifact(options: {
	target?: string;
	mode?: "plan" | "run";
	timeoutMs?: number;
	executions?: NativeRuntimeExecution[];
	runtimeAnchors?: string[];
}): NativeRuntimeArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const target = inferNativeRuntimeTarget(options.target);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 12000)));
	const plan = nativeRuntimePlanMatrices(target, timeoutMs);
	const nextActions = Array.from(
		new Set(
			[
				target && (options.mode ?? "plan") !== "run" ? `re_native_runtime run ${target} ${timeoutMs}` : undefined,
				...plan.nextActions,
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 12);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route.domain,
		target,
		mode: options.mode ?? "plan",
		timeoutMs,
		captureScript: plan.captureScript,
		binaryInventory: plan.binaryInventory,
		mitigationMatrix: plan.mitigationMatrix,
		loaderLibc: plan.loaderLibc,
		symbolMap: plan.symbolMap,
		crashPlan: plan.crashPlan,
		gdbTrace: plan.gdbTrace,
		breakpointPlan: plan.breakpointPlan,
		exploitScaffold: plan.exploitScaffold,
		replayCommands: plan.replayCommands,
		executions: options.executions ?? [],
		runtimeAnchors: options.runtimeAnchors ?? [],
		structuredSummary: prioritizeReverseProofLines(
			(options.runtimeAnchors ?? []).filter(
				(line: any) =>
					typeof line === "string" &&
					(line.startsWith("summary.") ||
						line.startsWith("[runtime-technique]") ||
						line.startsWith("proof.exit=") ||
						line.startsWith("query.proof_exit=") ||
						line.startsWith("bind_ready=") ||
						line.startsWith("query.bind_ready=")),
			),
			48,
		),
		nextActions,
		sourceArtifacts: [
			recentMarkdownArtifacts(evidenceMapsDir(), 1)[0],
			recentMarkdownArtifacts(evidenceRunsDir(), 1)[0],
			latestVerifierArtifactPath(),
			latestCompilerArtifactPath(),
			latestReplayerArtifactPath(),
			latestExploitLabArtifactPath(),
		].filter((path): path is string => Boolean(path)),
	};
}
