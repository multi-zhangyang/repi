/** JS signing run path with reverse domain next footer. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { ensureReconStorage } from "../resources.ts";
import { truncateMiddle } from "../text.ts";
import {
	formatJsSigning,
	inferJsSigningTarget,
	type JsSigningExecution,
	jsSigningAnchors,
	jsSigningShellCommand,
	jsSigningStructuredSummary,
} from "../web-runtime/js-signing.ts";
import { buildJsSigningArtifact } from "./js-signing-pure.ts";
import { jsSigningReverseFooter } from "./js-signing-run-reverse.ts";
import { writeJsSigningArtifact } from "./js-signing-write.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary, replayHash } from "./shared.ts";

export async function runJsSigning(
	pi: ExtensionAPI,
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): Promise<string> {
	ensureReconStorage();
	const target = inferJsSigningTarget(options.target, options.url);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	if (!target) {
		const artifact = buildJsSigningArtifact({ ...options, mode: "run", timeoutMs });
		artifact.executions.push({
			label: "js-signing-capture",
			command: artifact.captureScript,
			status: "blocked",
		} as JsSigningExecution);
		artifact.runtimeAnchors.push("error:missing target/url; pass https URL or local JS bundle path");
		applyReverseStructuredSummary(artifact, "runtimeAnchors");
		const path = writeJsSigningArtifact(artifact);
		return jsSigningReverseFooter({
			target,
			output: formatJsSigning(artifact, path),
			proofExit: "pending_runtime_capture",
			reverseReady: false,
			anchors: artifact.runtimeAnchors,
		});
	}
	const command = jsSigningShellCommand(target, timeoutMs);
	const result = await pi.exec("bash", ["-lc", command], { timeout: timeoutMs + 10000 });
	const stdout = String(result.stdout ?? "");
	const stderr = String(result.stderr ?? "");
	const code = Number(result.code ?? 1);
	const killed = Boolean(result.killed);
	const anchors = [
		...(jsSigningAnchors as any)(`${stdout}\n${stderr}`),
		...jsSigningStructuredSummary(stdout, stderr),
	];
	const artifact = buildJsSigningArtifact({
		target,
		url: options.url,
		mode: "run",
		timeoutMs,
		executions: [
			{
				label: "js-signing-capture",
				command,
				status: killed ? "blocked" : code === 0 ? "passed" : "failed",
				exit: code,
				killed,
				stdoutHash: replayHash(stdout),
				stderrHash: replayHash(stderr),
				stdoutHead: truncateMiddle(stdout.trim(), 3000),
				stderrHead: truncateMiddle(stderr.trim(), 2000),
			} as JsSigningExecution,
		],
		runtimeAnchors: anchors,
	});
	applyReverseStructuredSummary(artifact, "runtimeAnchors");
	const path = writeJsSigningArtifact(artifact);
	try {
		appendReverseRuntimeEvidence("js_signing", target, path, anchors, "pending_runtime_capture");
	} catch {
		/* best-effort */
	}
	const proofExit =
		anchors.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		anchors.find(
			(line: any) => /proof\.exit=(partial_runtime_capture|runtime_capture_strong)/i.exec(line)?.[1] ?? "",
		) ||
		(/runtime_capture_strong/i.test(anchors.join("\n"))
			? "runtime_capture_strong"
			: /partial_runtime_capture/i.test(anchors.join("\n"))
				? "partial_runtime_capture"
				: "pending_runtime_capture");
	const reverseReady = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit);
	const body = [
		formatJsSigning(artifact, path),
		stdout.trim() ? ["stdout:", "```", truncateMiddle(stdout.trim(), 6000), "```"].join("\n") : "",
		stderr.trim() ? ["stderr:", "```", truncateMiddle(stderr.trim(), 2000), "```"].join("\n") : "",
	]
		.filter(Boolean)
		.join("\n");
	return jsSigningReverseFooter({
		target,
		output: body,
		proofExit,
		reverseReady,
		anchors,
	});
}
