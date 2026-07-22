/** Web authz artifact build. */
// Landmark: webAuthzMatrixFields BOLA IDOR REPI_OBJECT_A bind_ready
/** Web authz anchors/format/summary with reverse proof fields. */

import { readCurrentMission } from "../compact-resume/deps.ts";
import { latestCompilerArtifactPath, latestVerifierArtifactPath } from "../proof-loop-core/deps-latest.ts";
import { latestReplayerArtifactPath } from "../replayer-runtime/io.ts";
import { ensureReconStorage } from "../resources/storage-ensure.ts";
import { inferWebAuthzUrl } from "../reverse-io/authz-pure-path.ts";
import { latestLiveBrowserArtifactPath } from "../reverse-io/browser-pure-path.ts";
import { recentMarkdownArtifacts } from "../storage/io/artifacts.ts";
import { evidenceMapsDir, evidenceRunsDir } from "../storage/paths/evidence-reverse.ts";
import { webAuthzStateShellCommand } from "./authz-script.ts";
import { webAuthzMatrixFields } from "./authz-summary-matrices.ts";
import type { WebAuthzStateArtifact, WebAuthzStateExecution } from "./types.ts";

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
	const matrices = webAuthzMatrixFields(url, timeoutMs);
	const nextActions = Array.from(
		new Set(
			[
				url && (options.mode ?? "plan") !== "run" ? `re_web_authz_state run ${url} ${timeoutMs}` : undefined,
				"re_live_browser run <url>",
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
		...matrices,
		executions: options.executions ?? [],
		runtimeAnchors: options.runtimeAnchors ?? [],
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
