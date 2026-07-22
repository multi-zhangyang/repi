/** Live browser proof.exit extraction + reverse footer body. */
import { truncateMiddle } from "../text.ts";
import { formatLiveBrowser } from "../web-runtime.ts";
import { browserRunReverseFooter } from "./browser-run-reverse.ts";

export function extractBrowserProofExit(anchors: string[]): string {
	const joined = anchors.join("\n");
	const challengeOnly =
		/summary\.challenge_interstitial=true|summary\.proof_honesty=challenge_surface_not_business_depth|note=challenge_surface_only/i.test(
			joined,
		) &&
		!/summary\.organic_api=true|\[browser-organic-api\]|summary\.capture\.organic_api=1/i.test(joined) &&
		!/summary\.capture\.sourcemap=1|\[browser-sourcemap\]/i.test(joined);
	const exits = anchors
		.map((line: any) => {
			const m = /^(?:proof\.exit|query\.proof_exit|summary\.runtime_proof_exit)=(.+)$/i.exec(String(line));
			return m?.[1]?.trim();
		})
		.filter(Boolean) as string[];
	const preferred =
		exits.find((e) => /partial_runtime_capture/i.test(e)) ||
		exits.find((e) => /runtime_capture_strong/i.test(e)) ||
		exits[0];
	if (challengeOnly) return "partial_runtime_capture";
	return preferred || "pending_runtime_capture";
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
