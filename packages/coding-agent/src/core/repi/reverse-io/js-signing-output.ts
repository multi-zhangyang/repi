import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { formatJsSigning } from "../web-runtime/js-signing.ts";
import { buildJsSigningArtifact, latestJsSigningArtifactPath } from "./js-signing-pure.ts";

import { writeJsSigningArtifact } from "./js-signing-write.ts";
import { applyReverseStructuredSummary } from "./shared.ts";

export function buildJsSigningOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): string {
	if (action === "show") {
		const path = latestJsSigningArtifactPath();
		if (!path) return "js_signing:\nstatus: missing\nnext: re_js_signing run <url-or-bundle>";
		return truncateMiddle(readText(path), 22000);
	}
	const artifact = buildJsSigningArtifact({ ...options, mode: "plan" });
	applyReverseStructuredSummary(artifact, "runtimeAnchors");
	const path = writeJsSigningArtifact(artifact);
	return [
		formatJsSigning(artifact, path),
		"proof.exit=pending_runtime_capture",
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: `frontend js signing ${options.target ?? options.url ?? ""}`,
			target: options.target ?? options.url,
			includeGates: true,
		}).map((cmd: any) => `next: ${cmd}`),
	].join("\n");
}
