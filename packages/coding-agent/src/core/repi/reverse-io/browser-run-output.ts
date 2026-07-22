import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { formatLiveBrowser } from "../web-runtime.ts";
import { buildLiveBrowserArtifact, latestLiveBrowserArtifactPath } from "./browser-pure.ts";

import { writeLiveBrowserArtifact } from "./browser-run.ts";
import { applyReverseStructuredSummary } from "./shared.ts";

export function buildLiveBrowserOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): string {
	if (action === "show") {
		const path = latestLiveBrowserArtifactPath();
		if (!path) return "live_browser:\nstatus: missing\nnext: re_live_browser run <URL>";
		return truncateMiddle(readText(path), 22000);
	}
	const browser = buildLiveBrowserArtifact({ ...options, mode: "plan" });
	applyReverseStructuredSummary(browser, "runtimeAnchors");
	const path = writeLiveBrowserArtifact(browser);
	return [
		formatLiveBrowser(browser, path),
		"proof.exit=pending_runtime_capture",
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		"next: re_live_browser run <URL>",
		"next: re_domain_proof_exit show",
		"next: re_complete audit",
	].join("\n");
}
