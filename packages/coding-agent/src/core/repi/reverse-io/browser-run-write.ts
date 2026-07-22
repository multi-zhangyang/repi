/** Live browser artifact write. */
/** Reverse I/O browser: run/write/output. */
/** Reverse I/O domain: browser. */
import { join } from "node:path";
import { ensureReconStorage } from "../resources.ts";
import {
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseStructuredSummaryMarkdown,
} from "../reverse-evidence.ts";
import { evidenceBrowserDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { formatLiveBrowser, type LiveBrowserArtifact } from "../web-runtime.ts";
import { appendEvidence, reverseEvidenceLedgerFields, updateMissionCheckpoint } from "./shared.ts";

export function writeLiveBrowserArtifact(browser: LiveBrowserArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceBrowserDir(),
		`${browser.timestamp.replace(/[:.]/g, "-")}-${slug(browser.url ?? browser.target ?? "browser")}-${browser.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Live Browser Artifact",
			"",
			formatLiveBrowser(browser, path),
			"",
			"## Structured Summary",
			"",
			...reverseStructuredSummaryMarkdown(browser.structuredSummary, browser.runtimeAnchors),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(browser, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: browser.mode === "run" ? "runtime" : "artifact",
		title: `live-browser-${browser.mode} ${browser.url ?? browser.target ?? "no-url"}`,
		fact: reverseEvidenceFactLine(`live-browser-${browser.mode}`, browser.structuredSummary, [
			...reverseEvidenceLedgerFields(browser.structuredSummary).factExtra,
			...[
				`url=${browser.url ?? "<missing>"}`,
				`executions=${browser.executions.length}`,
				`anchors=${browser.runtimeAnchors.length}`,
			],
		]),
		command: `re_live_browser ${browser.mode}${browser.url ? ` ${browser.url}` : ""}`,
		path,
		verify: `cat ${path}`,
		confidence: reverseEvidenceConfidence("browser/XHR/WS runtime capture", browser.structuredSummary),
		query: reverseEvidenceLedgerFields(browser.structuredSummary).query,
		meta: reverseEvidenceLedgerFields(browser.structuredSummary).meta,
	});
	const blocked =
		browser.runtimeAnchors.some((anchor: any) => /invalid_url|missing concrete URL/i.test(anchor)) ||
		(browser.mode === "run" &&
			browser.executions.length > 0 &&
			browser.executions.every((item: any) => item.status === "blocked"));
	updateMissionCheckpoint("live_browser_ready", blocked ? "blocked" : "done", path);
	return path;
}
