/** Browser pure: build live browser artifact with reverse next. */
// Landmark: liveBrowserProbeMatrices reverseDomainCaptureNextCommands websocket

import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { prioritizeReverseProofLines, reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceMapsDir, recentMarkdownArtifacts } from "../storage.ts";
import { shellQuote } from "../target.ts";
import {
	type LiveBrowserArtifact,
	type LiveBrowserExecution,
	liveBrowserInvalidUrlReason,
	liveBrowserShellCommand,
} from "../web-runtime.ts";
import { inferBrowserUrl } from "./browser-pure-path.ts";
import { liveBrowserProbeMatrices } from "./browser-pure-probes.ts";
import { latestContextPackArtifactPath, latestKernelArtifactPath } from "./shared.ts";

export function buildLiveBrowserArtifact(options: {
	target?: string;
	url?: string;
	mode?: "plan" | "run";
	timeoutMs?: number;
	executions?: LiveBrowserExecution[];
	runtimeAnchors?: string[];
}): LiveBrowserArtifact {
	ensureReconStorage();
	const mission = readCurrentMission();
	const invalidUrl = liveBrowserInvalidUrlReason(options.target, options.url);
	const url = invalidUrl ? undefined : (options.url ?? inferBrowserUrl(options.target));
	const timeoutMs = Math.max(3000, Math.min(120000, Math.floor(options.timeoutMs ?? 15000)));
	const captureCommand = url
		? liveBrowserShellCommand(url, timeoutMs)
		: invalidUrl
			? `# blocked: invalid_url; re_live_browser requires an explicit http(s):// URL, got ${shellQuote(options.url ?? options.target ?? "")}`
			: "# missing URL: run re_map https://target first or pass target/url";
	const runtimeWorkdir = "${REPI_RUNTIME_WORKDIR:-$HOME/.repi/agent/recon/runtime/web}";
	const replayCommands = [
		url ? `curl -k -i --max-time 15 ${shellQuote(url)}` : "curl -k -i --max-time 15 <URL>",
		url
			? `node ${runtimeWorkdir}/live-browser.js ${shellQuote(url)} ${timeoutMs}`
			: `node ${runtimeWorkdir}/live-browser.js <URL> 15000`,
		"re_live_browser run <URL>",
	];
	const probes = liveBrowserProbeMatrices(url);
	const runtimeMatrix = [
		`url=${url ?? "<missing>"}`,
		`mode=${options.mode ?? "plan"}`,
		`timeout_ms=${timeoutMs}`,
		"engine=playwright-if-installed, node-fetch-fallback",
		"captures=request,response,websocket,storage,forms,links,body-head",
		...(invalidUrl ? [`status=blocked reason=${invalidUrl}`] : []),
	];
	const nextActions = Array.from(
		new Set([
			invalidUrl
				? "re_map <URL> 2 # blocked: invalid_url; pass explicit http(s):// URL"
				: url
					? `re_live_browser run ${url}`
					: "re_map <URL> 2",
			...reverseDomainCaptureNextCommands({
				routeOrBlob: `web browser authz ${url ?? options.target ?? ""}`,
				target: url ?? options.target,
				includeGates: true,
			}),
			"re_verifier matrix",
		]),
	).slice(0, 12);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route?.domain,
		target: options.target,
		mode: options.mode ?? "plan",
		url,
		timeoutMs,
		captureScript: captureCommand,
		runtimeMatrix,
		...probes,
		replayCommands,
		executions: options.executions ?? [],
		runtimeAnchors:
			options.runtimeAnchors ?? (invalidUrl ? [`error:${invalidUrl}; pass an explicit http(s):// URL`] : []),
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
			latestKernelArtifactPath(),
			latestContextPackArtifactPath(),
		].filter((path): path is string => Boolean(path)),
	};
}
