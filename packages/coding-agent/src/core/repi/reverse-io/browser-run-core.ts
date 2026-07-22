/** Live browser run with reverse proof footer. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { truncateMiddle } from "../text.ts";
import {
	formatLiveBrowser,
	liveBrowserAnchors,
	liveBrowserInvalidUrlReason,
	liveBrowserShellCommand,
	liveBrowserStructuredSummary,
} from "../web-runtime.ts";
import { buildLiveBrowserArtifact, inferBrowserUrl } from "./browser-pure.ts";
import { formatBrowserRunOutputWithReverseFooter } from "./browser-run-core-proof.ts";
import { writeLiveBrowserArtifact } from "./browser-run-write.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary, replayHash } from "./shared.ts";

export async function runLiveBrowser(
	pi: ExtensionAPI,
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): Promise<string> {
	const invalidUrl = liveBrowserInvalidUrlReason(options.target, options.url);
	const url = invalidUrl ? undefined : (options.url ?? inferBrowserUrl(options.target));
	const timeoutMs = Math.max(3000, Math.min(120000, Math.floor(options.timeoutMs ?? 15000)));
	if (invalidUrl || !url) {
		const browser = buildLiveBrowserArtifact({ ...options, mode: "run", timeoutMs });
		browser.executions.push({
			label: "browser-runtime-capture",
			command: browser.captureScript,
			status: "blocked",
		});
		browser.runtimeAnchors.push(
			invalidUrl
				? `error:${invalidUrl}; re_live_browser does not fallback to historical URLs`
				: "error:missing concrete URL; run re_map <URL> or pass target/url",
		);
		applyReverseStructuredSummary(browser, "runtimeAnchors");
		const path = writeLiveBrowserArtifact(browser);
		appendReverseRuntimeEvidence(
			"live_browser",
			options.target || url,
			path,
			browser.runtimeAnchors || [],
			"blocked",
		);
		return formatLiveBrowser(browser, path);
	}
	const command = liveBrowserShellCommand(url, timeoutMs);
	const result = await pi.exec("bash", ["-lc", command], { timeout: timeoutMs + 10000 });
	const anchors = [
		...liveBrowserStructuredSummary(result.stdout, result.stderr),
		...liveBrowserAnchors(result.stdout, result.stderr),
		"[runtime-technique] js-sourcemap-secret-harvest | web-idor-bola | web-jwt-confusion | web-ssrf-metadata",
	];
	const browser = buildLiveBrowserArtifact({
		...options,
		url,
		mode: "run",
		timeoutMs,
		executions: [
			{
				label: "browser-runtime-capture",
				command,
				status: result.code === 0 ? "passed" : "failed",
				exit: result.code,
				killed: result.killed,
				stdoutHash: replayHash(result.stdout),
				stderrHash: replayHash(result.stderr),
				stdoutHead: truncateMiddle(result.stdout.trim(), 3000),
				stderrHead: truncateMiddle(result.stderr.trim(), 2000),
			},
		],
		runtimeAnchors: anchors,
	});
	applyReverseStructuredSummary(browser, "runtimeAnchors");
	const path = writeLiveBrowserArtifact(browser);
	appendReverseRuntimeEvidence("live_browser", url, path, anchors, result.code === 0 ? "passed" : "failed");
	return formatBrowserRunOutputWithReverseFooter({
		browser,
		path,
		stdout: result.stdout,
		stderr: result.stderr,
		target: options.target,
		anchors,
	});
}
