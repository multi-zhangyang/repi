/** Live browser pure helpers. */

import { evidenceMapsDir, readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";
import { interestingLines, truncateMiddle } from "../text.ts";
import type { LiveBrowserArtifact } from "./types.ts";

export { liveBrowserNodeScript, liveBrowserShellCommand } from "./browser-capture-script.ts";
export { liveBrowserStructuredSummary } from "./browser-summary.ts";

export function inferBrowserUrl(target?: string): string | undefined {
	const trimmed = target?.trim();
	if (trimmed) return /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
	const latestMap = recentMarkdownArtifacts(evidenceMapsDir(), 1)[0];
	const mapText = latestMap ? readText(latestMap) : "";
	const targetLine = /^target=(https?:\/\/\S+)/m.exec(mapText)?.[1];
	if (targetLine) return targetLine.replace(/["'`]+$/g, "");
	const urlLine = /(https?:\/\/[^\s"'`<>]+)/i.exec(mapText)?.[1];
	return urlLine?.replace(/[),.;]+$/g, "");
}

export function liveBrowserInvalidUrlReason(target?: string, url?: string): string | undefined {
	const candidate = url?.trim() || target?.trim();
	if (!candidate) return undefined;
	return /^https?:\/\//i.test(candidate) ? undefined : `invalid_url target=${candidate}`;
}

export function liveBrowserAnchors(stdout: string, stderr: string): string[] {
	const text = `${stdout}\n${stderr}`;
	return [
		...interestingLines(text, /\[browser-request\]/i, 20).map((line) => `request:${truncateMiddle(line, 260)}`),
		...interestingLines(text, /\[browser-response\]/i, 20).map((line) => `response:${truncateMiddle(line, 260)}`),
		...interestingLines(text, /\[browser-websocket\]|\[browser-ws-frame/i, 12).map(
			(line) => `websocket:${truncateMiddle(line, 260)}`,
		),
		...interestingLines(text, /\[browser-storage\]/i, 8).map((line) => `storage:${truncateMiddle(line, 260)}`),
		...interestingLines(text, /\[browser-error\]/i, 8).map((line) => `error:${truncateMiddle(line, 260)}`),
	].slice(0, 60);
}

export function formatLiveBrowser(browser: LiveBrowserArtifact, path?: string): string {
	return [
		"live_browser:",
		path ? `browser_artifact: ${path}` : undefined,
		`timestamp: ${browser.timestamp}`,
		`mode: ${browser.mode}`,
		`mission_id: ${browser.missionId ?? "none"}`,
		`route: ${browser.route ?? "none"}`,
		`target: ${browser.target ?? "<none>"}`,
		`url: ${browser.url ?? "<missing>"}`,
		`timeout_ms: ${browser.timeoutMs}`,
		"runtime_matrix:",
		...(browser.runtimeMatrix.length ? browser.runtimeMatrix.map((item) => `- ${item}`) : ["- none"]),
		"request_response_log:",
		...(browser.executions.length
			? browser.executions.map(
					(item) =>
						`- ${item.label} [${item.status}] exit=${item.exit ?? "n/a"} stdout_sha256=${item.stdoutHash ?? "n/a"} stderr_sha256=${item.stderrHash ?? "n/a"}`,
				)
			: ["- planned capture; run re_live_browser run <URL>"]),
		"runtime_anchors:",
		...(browser.runtimeAnchors.length ? browser.runtimeAnchors.map((item) => `- ${item}`) : ["- none"]),
		"auth_matrix:",
		...(browser.authMatrix.length ? browser.authMatrix.map((item) => `- ${item}`) : ["- none"]),
		"idor_bola_probe_templates:",
		...(browser.idorBolaProbes.length ? browser.idorBolaProbes.map((item) => `- ${item}`) : ["- none"]),
		"websocket_probes:",
		...(browser.websocketProbes.length ? browser.websocketProbes.map((item) => `- ${item}`) : ["- none"]),
		"replay_commands:",
		...(browser.replayCommands.length ? browser.replayCommands.map((item) => `- ${item}`) : ["- none"]),
		"capture_script:",
		"```bash",
		browser.captureScript,
		"```",
		"browser_next_actions:",
		...(browser.nextActions.length ? browser.nextActions.map((item) => `- ${item}`) : ["- re_map <URL> 2"]),
		`next_browser_command: ${browser.mode === "run" ? "re_verifier matrix" : "re_live_browser run <URL>"}`,
		"source_artifacts:",
		...(browser.sourceArtifacts.length ? browser.sourceArtifacts.map((item) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
