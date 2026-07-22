/** Mobile runtime run with reverse proof footer. */
// Landmark: reverseDomainCaptureNextCommands includeGates: true mobileRuntimeReverseFooter proof.exit bind_ready

import type { ExtensionAPI } from "../../extensions/types.ts";
import {
	formatMobileRuntime,
	mobileRuntimeAnchors,
	mobileRuntimeShellCommand,
	mobileRuntimeStructuredSummary,
} from "../reverse-runtime.ts";
import { truncateMiddle } from "../text.ts";
import { buildMobileRuntimeArtifact, inferMobilePackageName } from "./mobile-pure.ts";
import { mobileRuntimeReverseFooter } from "./mobile-run-footer.ts";
import { writeMobileRuntimeArtifact } from "./mobile-run-write.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary, replayHash } from "./shared.ts";
export async function runMobileRuntime(
	pi: ExtensionAPI,
	options: { target?: string; packageName?: string; timeoutMs?: number } = {},
): Promise<string> {
	const packageName = inferMobilePackageName(options.target, options.packageName);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	const command = mobileRuntimeShellCommand(options.target, packageName, timeoutMs);
	const result = await pi.exec("bash", ["-lc", command], { timeout: timeoutMs + 10000 });
	const anchors = [
		...mobileRuntimeStructuredSummary(result.stdout, result.stderr),
		...mobileRuntimeAnchors(result.stdout, result.stderr),
		"[runtime-technique] mobile-apk-triage-frida-bridge | mobile-ssl-pinning-bypass | mobile-root-bypass",
	];
	const mobile = buildMobileRuntimeArtifact({
		...options,
		packageName,
		mode: "run",
		timeoutMs,
		executions: [
			{
				label: "mobile-runtime-capture",
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
	applyReverseStructuredSummary(mobile, "runtimeAnchors");
	const path = writeMobileRuntimeArtifact(mobile);
	appendReverseRuntimeEvidence(
		"mobile_runtime",
		options.target,
		path,
		anchors,
		result.code === 0 ? "passed" : "failed",
	);
	const reverseFooter = mobileRuntimeReverseFooter({
		anchors,
		target: options.target,
		packageName: options.packageName ?? packageName,
	});
	return [
		formatMobileRuntime(mobile, path),
		result.stdout.trim() ? ["stdout:", "```", truncateMiddle(result.stdout.trim(), 6000), "```"].join("\n") : "",
		result.stderr.trim() ? ["stderr:", "```", truncateMiddle(result.stderr.trim(), 2000), "```"].join("\n") : "",
		...reverseFooter,
	]
		.filter(Boolean)
		.join("\n");
}
