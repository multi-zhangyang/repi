/** Build web authz state artifact with reverse next. */

import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceMapsDir, evidenceRunsDir, recentMarkdownArtifacts } from "../storage.ts";
import { type WebAuthzStateArtifact, type WebAuthzStateExecution, webAuthzStateShellCommand } from "../web-runtime.ts";
import { webAuthzPlanMatrices } from "./authz-pure-build-matrices.ts";
import { inferWebAuthzUrl } from "./authz-pure-path.ts";
import { latestLiveBrowserArtifactPath } from "./browser-pure.ts";
import { latestCompilerArtifactPath, latestReplayerArtifactPath, latestVerifierArtifactPath } from "./shared.ts";
export function buildWebAuthzStateArtifact(options: {
	target?: string;
	url?: string;
	mode?: "plan" | "run";
	timeoutMs?: number;
	executions?: WebAuthzStateExecution[];
	runtimeAnchors?: string[];
}): WebAuthzStateArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const url = inferWebAuthzUrl(options.url ?? options.target);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	const captureScript = webAuthzStateShellCommand(url, timeoutMs);
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `web_authz ${url ?? options.target ?? ""} authz state`,
		target: url ?? options.target,
		includeGates: true,
	}).slice(0, 3);
	const {
		routeInventory,
		principalMatrix,
		objectProbes,
		stateMachine,
		sequenceReplay,
		ownershipChecks,
		rollbackChecks,
		replayCommands,
	} = webAuthzPlanMatrices(url, timeoutMs);
	const nextActions = Array.from(
		new Set(
			[
				...reverseNext,
				url && (options.mode ?? "plan") !== "run" ? `re_web_authz_state run ${url} ${timeoutMs}` : undefined,
				"re_live_browser run <url>",
				"re_domain_proof_exit show",
				"re_verifier matrix",
				"re_compiler draft",
				"re_replayer run",
				"re_knowledge_graph build",
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 12);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route.domain,
		target: options.target?.trim() || url,
		mode: options.mode ?? "plan",
		url,
		timeoutMs,
		captureScript,
		routeInventory,
		principalMatrix,
		objectProbes,
		stateMachine,
		sequenceReplay,
		ownershipChecks,
		rollbackChecks,
		replayCommands,
		executions: options.executions ?? [],
		runtimeAnchors: options.runtimeAnchors ?? [],
		structuredSummary: (options.runtimeAnchors ?? [])
			.filter((line: string) => line.startsWith("summary.") || line.startsWith("[runtime-technique]"))
			.slice(0, 40),
		nextActions,
		sourceArtifacts: [
			latestLiveBrowserArtifactPath(),
			recentMarkdownArtifacts(evidenceMapsDir(), 1)[0],
			recentMarkdownArtifacts(evidenceRunsDir(), 1)[0],
			latestVerifierArtifactPath(),
			latestCompilerArtifactPath(),
			latestReplayerArtifactPath(),
		].filter((path): path is string => Boolean(path)),
	};
}
