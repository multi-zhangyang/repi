/** Native runtime run with reverse proof footer. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import {
	formatNativeRuntime,
	nativeRuntimeAnchors,
	nativeRuntimeShellCommand,
	nativeRuntimeStructuredSummary,
} from "../reverse-runtime.ts";
import { truncateMiddle } from "../text.ts";
import { buildNativeRuntimeArtifact, inferNativeRuntimeTarget } from "./native-pure.ts";
import { writeNativeRuntimeArtifact } from "./native-run.ts";
import { nativeProofExitFromAnchors, nativeReverseFooter } from "./native-run-footer.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary, replayHash } from "./shared.ts";
// Landmark: reverseDomainCaptureNextCommands / includeGates: true (body in native-run-footer.ts)

export async function runNativeRuntime(
	pi: ExtensionAPI,
	options: { target?: string; timeoutMs?: number } = {},
): Promise<string> {
	const target = inferNativeRuntimeTarget(options.target);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 12000)));
	const command = nativeRuntimeShellCommand(target, timeoutMs);
	const result = await pi.exec("bash", ["-lc", command], { timeout: timeoutMs + 10000 });
	const anchors = [
		...nativeRuntimeStructuredSummary(result.stdout, result.stderr),
		...nativeRuntimeAnchors(result.stdout, result.stderr),
		"[runtime-technique] rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch",
	];
	const native = buildNativeRuntimeArtifact({
		...options,
		target,
		mode: "run",
		timeoutMs,
		executions: [
			{
				label: "native-runtime-capture",
				command,
				status: /\[native-runtime-blocked\] reason=missing_target/i.test(`${result.stdout}\n${result.stderr}`)
					? "blocked"
					: result.code === 0
						? "passed"
						: "failed",
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
	applyReverseStructuredSummary(native, "runtimeAnchors");
	const path = writeNativeRuntimeArtifact(native);
	appendReverseRuntimeEvidence("native_runtime", target, path, anchors, result.code === 0 ? "passed" : "failed");
	const proofExit = nativeProofExitFromAnchors(anchors);
	const reverseFooter = nativeReverseFooter(proofExit, target, anchors);
	return [
		formatNativeRuntime(native, path),
		result.stdout.trim() ? ["stdout:", "```", truncateMiddle(result.stdout.trim(), 6000), "```"].join("\n") : "",
		result.stderr.trim() ? ["stderr:", "```", truncateMiddle(result.stderr.trim(), 2000), "```"].join("\n") : "",
		...reverseFooter,
	]
		.filter(Boolean)
		.join("\n");
}
