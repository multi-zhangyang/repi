/** Runtime reverse capture scoring from tool output (native/mobile/web/exploit). */

import { scoreExploitRuntimeCapture } from "./runtime-scoring-exploit.ts";
import { scoreMobileRuntimeCapture } from "./runtime-scoring-mobile.ts";
import { scoreNativeRuntimeCapture } from "./runtime-scoring-native.ts";
import { scoreWebRuntimeCapture } from "./runtime-scoring-web.ts";

export function reverseRuntimeCaptureProofFields(
	domain: "native" | "mobile" | "exploit" | "web" | "web_authz",
	text: string,
	lines: string[],
): string[] {
	const has = (re: RegExp) => re.test(text);
	const count = (re: RegExp) => (text.match(re) || []).length;
	const scored =
		domain === "native"
			? scoreNativeRuntimeCapture({ text, lines, has, count })
			: domain === "mobile"
				? scoreMobileRuntimeCapture({ text, lines, has, count })
				: domain === "exploit"
					? scoreExploitRuntimeCapture({ text, lines, has, count })
					: scoreWebRuntimeCapture({ text, lines, has, count, domain });
	const { signals, capture, confidence, out } = scored;
	if (signals.length) {
		out.push(`summary.capture_signals=${signals.join(",")}`);
		out.push(`query.capture_signals=${signals.join(",")}`);
	}
	out.push(`summary.capture_confidence=${confidence}`);
	out.push(`query.capture_confidence=${String(confidence)}`);
	if (capture === "none") {
		out.push("query.proof_exit=pending_runtime_capture");
		out.push("summary.runtime_proof_exit=pending_runtime_capture");
		out.push("query.bind_ready=false");
		out.push("summary.bind_ready=false");
		out.push("bind_ready=false");
	} else {
		out.push(`proof.exit=${capture}`);
		out.push(`query.proof_exit=${capture}`);
		out.push(`summary.runtime_proof_exit=${capture}`);
		// Runtime capture partial/strong is bind-ready for claim gates when technique bind is pending.
		out.push("query.bind_ready=true");
		out.push("summary.bind_ready=true");
		out.push("bind_ready=true");
		out.push("bind.ready=true");
	}
	out.push("reverse_proof_gate=require_proof_exit_before_claim");
	return Array.from(new Set(out)).slice(0, 24);
}
