/** Mobile runtime output builder with reverse gate. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { formatMobileRuntime } from "../reverse-runtime.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildMobileRuntimeArtifact, latestMobileRuntimeArtifactPath } from "./mobile-pure.ts";
import { writeMobileRuntimeArtifact } from "./mobile-run-write.ts";
import { applyReverseStructuredSummary } from "./shared.ts";

export function buildMobileRuntimeOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; packageName?: string; timeoutMs?: number } = {},
): string {
	if (action === "show") {
		const path = latestMobileRuntimeArtifactPath();
		if (!path) return "mobile_runtime:\nstatus: missing\nnext: re_mobile_runtime run <apk-or-package>";
		return truncateMiddle(readText(path), 22000);
	}
	const mobile = buildMobileRuntimeArtifact({ ...options, mode: "plan" });
	applyReverseStructuredSummary(mobile, "runtimeAnchors");
	const path = writeMobileRuntimeArtifact(mobile);
	return [
		formatMobileRuntime(mobile, path),
		"proof.exit=pending_runtime_capture",
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		...reverseDomainCaptureNextCommands({
			routeOrBlob: `mobile ${options.target ?? options.packageName ?? ""}`,
			target: options.target ?? options.packageName,
			includeGates: true,
		}).map((cmd: any) => `next: ${cmd}`),
	].join("\n");
}
