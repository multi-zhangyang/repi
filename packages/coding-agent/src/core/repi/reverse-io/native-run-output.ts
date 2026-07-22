/** Native runtime output builder with reverse gate. */
/** Reverse I/O native: run/write/output. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { formatNativeRuntime } from "../reverse-runtime.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildNativeRuntimeArtifact, latestNativeRuntimeArtifactPath } from "./native-pure.ts";

import { writeNativeRuntimeArtifact } from "./native-run.ts";
import { applyReverseStructuredSummary } from "./shared.ts";

export function buildNativeRuntimeOutput(
	action: "plan" | "show" = "plan",
	options: { target?: string; timeoutMs?: number } = {},
): string {
	if (action === "show") {
		const path = latestNativeRuntimeArtifactPath();
		if (!path) return "native_runtime:\nstatus: missing\nnext: re_native_runtime run <elf-or-so>";
		return truncateMiddle(readText(path), 22000);
	}
	const native = buildNativeRuntimeArtifact({ ...options, mode: "plan" });
	applyReverseStructuredSummary(native, "runtimeAnchors");
	const path = writeNativeRuntimeArtifact(native);
	// Plan mode writes artifact only; runtime capture requires `re_native_runtime run`.
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `native ${options.target ?? ""} plan pending_runtime_capture`,
		target: options.target,
		includeGates: true,
	});
	return [
		formatNativeRuntime(native, path),
		"proof.exit=pending_runtime_capture",
		"bind_ready=false",
		"reverse_proof_gate=require_proof_exit_before_claim",
		"prefer_run_over_plan_for_capture=true",
		...reverseNext.map((cmd: any) => (cmd.startsWith("reverse_runtime_capture_gate:") ? cmd : `next: ${cmd}`)),
	].join("\n");
}
