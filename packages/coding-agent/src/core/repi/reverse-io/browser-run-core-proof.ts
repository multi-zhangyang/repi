/** Live browser proof.exit extraction + reverse footer body. */
import { truncateMiddle } from "../text.ts";
import { formatLiveBrowser } from "../web-runtime.ts";
import { browserRunReverseFooter } from "./browser-run-reverse.ts";

export function extractBrowserProofExit(anchors: string[]): string {
	return (
		anchors.find((line: any) => /^proof\.exit=/.test(line))?.replace(/^proof\.exit=/, "") ||
		anchors.find((line: any) => /^query\.proof_exit=/.test(line))?.replace(/^query\.proof_exit=/, "") ||
		anchors
			.find((line: any) => /^summary\.runtime_proof_exit=/.test(line))
			?.replace(/^summary\.runtime_proof_exit=/, "") ||
		"pending_runtime_capture"
	);
}

export function formatBrowserRunOutputWithReverseFooter(params: {
	browser: any;
	path: string;
	stdout: string;
	stderr: string;
	target?: string;
	anchors: string[];
}): string {
	const proofExit = extractBrowserProofExit(params.anchors);
	const reverseReady = /^(partial_runtime_capture|runtime_capture_strong)$/i.test(proofExit);
	const body = [
		formatLiveBrowser(params.browser, params.path),
		params.stdout.trim() ? ["stdout:", "```", truncateMiddle(params.stdout.trim(), 6000), "```"].join("\n") : "",
		params.stderr.trim() ? ["stderr:", "```", truncateMiddle(params.stderr.trim(), 2000), "```"].join("\n") : "",
	]
		.filter(Boolean)
		.join("\n");
	return browserRunReverseFooter({
		target: params.target,
		output: body,
		proofExit,
		reverseReady,
	});
}
