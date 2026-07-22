import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { formatWebAuthzState } from "../web-runtime.ts";
import { buildWebAuthzStateArtifact, latestWebAuthzStateArtifactPath } from "./authz-pure.ts";

import { writeWebAuthzStateArtifact } from "./authz-run-write.ts";
import { applyReverseStructuredSummary } from "./shared.ts";

export function buildWebAuthzStateOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): string {
	if (action === "show") {
		const path = latestWebAuthzStateArtifactPath();
		if (!path) return "web_authz_state:\nstatus: missing\nnext: re_web_authz_state run <url>";
		return truncateMiddle(readText(path), 22000);
	}
	const authz = buildWebAuthzStateArtifact({ ...options, mode: "plan" });
	applyReverseStructuredSummary(authz, "runtimeAnchors");
	const path = writeWebAuthzStateArtifact(authz);
	return [
		formatWebAuthzState(authz, path),
		"proof.exit=pending_runtime_capture",
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: `web authz browser ${options.target ?? options.url ?? ""}`,
			target: options.target ?? options.url,
			includeGates: true,
		}).map((cmd: any) => `next: ${cmd}`),
	].join("\n");
}
