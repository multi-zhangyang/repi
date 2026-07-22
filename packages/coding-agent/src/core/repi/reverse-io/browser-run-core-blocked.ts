import { formatLiveBrowser, liveBrowserInvalidUrlReason } from "../web-runtime.ts";
import { buildLiveBrowserArtifact, inferBrowserUrl, writeLiveBrowserArtifact } from "./browser-pure.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary } from "./shared.ts";

export function runLiveBrowserBlockedPath(options: { target?: string; url?: string; timeoutMs: number }): string {
	const invalidUrl = liveBrowserInvalidUrlReason(options.target, options.url);
	const url = invalidUrl ? undefined : (options.url ?? inferBrowserUrl(options.target));
	const browser = buildLiveBrowserArtifact({ ...options, mode: "run", timeoutMs: options.timeoutMs });
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
	appendReverseRuntimeEvidence("live_browser", options.target || url, path, browser.runtimeAnchors || [], "blocked");
	return formatLiveBrowser(browser, path);
}
