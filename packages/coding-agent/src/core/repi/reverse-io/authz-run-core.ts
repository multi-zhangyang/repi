/** Web authz state run with reverse proof footer. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { truncateMiddle } from "../text.ts";
import {
	formatWebAuthzState,
	webAuthzStateAnchors,
	webAuthzStateShellCommand,
	webAuthzStructuredSummary,
} from "../web-runtime.ts";
import { buildWebAuthzStateArtifact, inferWebAuthzUrl } from "./authz-pure.ts";
import { authzProofExitFromAnchors, authzReverseFooter } from "./authz-run-footer.ts";
import { writeWebAuthzStateArtifact } from "./authz-run-write.ts";
import { appendReverseRuntimeEvidence, applyReverseStructuredSummary, replayHash } from "./shared.ts";
// Landmark for product-contract monofile scan: reverseDomainCaptureNextCommands / includeGates: true (body in authz-run-footer.ts).

export async function runWebAuthzState(
	pi: ExtensionAPI,
	options: { target?: string; url?: string; timeoutMs?: number } = {},
): Promise<string> {
	const url = inferWebAuthzUrl(options.url ?? options.target);
	const timeoutMs = Math.max(3000, Math.min(180000, Math.floor(options.timeoutMs ?? 15000)));
	const command = webAuthzStateShellCommand(url, timeoutMs);
	const result = await pi.exec("bash", ["-lc", command], { timeout: timeoutMs + 10000 });
	const anchors = [
		...webAuthzStructuredSummary(result.stdout, result.stderr),
		...webAuthzStateAnchors(result.stdout, result.stderr),
		"[runtime-technique] web-idor-bola | web-jwt-confusion | web-oauth-pkce-confusion",
	];
	const authz = buildWebAuthzStateArtifact({
		...options,
		url,
		mode: "run",
		timeoutMs,
		executions: [
			{
				label: "web-authz-state-capture",
				command,
				status: /\[web-authz-blocked\] reason=(missing_url|node_or_url_missing)/i.test(
					`${result.stdout}\n${result.stderr}`,
				)
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
	applyReverseStructuredSummary(authz, "runtimeAnchors");
	const path = writeWebAuthzStateArtifact(authz);
	appendReverseRuntimeEvidence(
		"web_authz_state",
		url,
		path,
		anchors,
		/\[web-authz-blocked\]/i.test(`${result.stdout}\n${result.stderr}`)
			? "blocked"
			: result.code === 0
				? "passed"
				: "failed",
	);
	const proofExit = authzProofExitFromAnchors(anchors);
	const reverseFooter = authzReverseFooter(proofExit, url, options.target, anchors);
	return [
		formatWebAuthzState(authz, path),
		result.stdout.trim() ? ["stdout:", "```", truncateMiddle(result.stdout.trim(), 6000), "```"].join("\n") : "",
		result.stderr.trim() ? ["stderr:", "```", truncateMiddle(result.stderr.trim(), 2000), "```"].join("\n") : "",
		...reverseFooter,
	]
		.filter(Boolean)
		.join("\n");
}
