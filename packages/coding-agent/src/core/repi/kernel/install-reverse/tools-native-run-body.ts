/** re_native_runtime run-body helpers. */
import { truncateMiddle } from "../../text.ts";
import { releaseCaptureSlot } from "./tools-capture-inflight.ts";
import { softMarkReverseFromNative } from "./tools-native-ready.ts";

export function buildNativeReuseResult(
	reused: {
		path: string;
		ageMs: number;
		body: string;
	},
	target?: string,
) {
	softMarkReverseFromNative(reused.path);
	const nl = "\n";
	const note = [
		"native_runtime:",
		"status: reuse",
		`path: ${reused.path}`,
		`ageMs: ${reused.ageMs}`,
		"note: latest same-target native capture within 120s; do not re-run",
		"next: re_domain_proof_exit show",
	].join(nl);
	releaseCaptureSlot("native_runtime");
	return {
		content: [{ type: "text" as const, text: truncateMiddle(`${note}${nl}${nl}${reused.body}`, 20000) }],
		details: {
			action: "reuse",
			reused: true,
			path: reused.path,
			target,
			ageMs: reused.ageMs,
		} as Record<string, unknown>,
	};
}

export function buildNativeRunResult(params: { text: string; coalesced: boolean; target?: string; path?: string }) {
	releaseCaptureSlot("native_runtime");
	return {
		content: [
			{
				type: "text" as const,
				text: truncateMiddle(
					params.coalesced
						? `native_runtime:\nstatus: coalesce\nnote: joined in-flight same-target native run\n\n${params.text}`
						: params.text,
					20000,
				),
			},
		],
		details: {
			action: params.coalesced ? "coalesce" : "run",
			path: params.path,
			target: params.target,
			coalesced: params.coalesced,
		} as Record<string, unknown>,
	};
}
