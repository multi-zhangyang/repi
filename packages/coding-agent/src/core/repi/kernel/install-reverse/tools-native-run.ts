/** re_native_runtime execute run path. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";
import { truncateMiddle } from "../../text.ts";
import { markMissionReverseBound, tryAcquireCaptureSlot } from "./tools-capture-inflight.ts";
import { buildNativeReverseReadyStopText, reverseProofBound, softMarkReverseFromNative } from "./tools-native-ready.ts";
import { runNativeRuntimeCoalesced, tryReuseRecentNativeRuntimeArtifact } from "./tools-native-reuse.ts";
import { buildNativeReuseResult, buildNativeRunResult } from "./tools-native-run-body.ts";
import type { ReverseRuntimeToolDeps } from "./types.ts";

export async function executeNativeRuntimeTool(
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
	params: any,
): Promise<{ content: { type: "text"; text: string }[]; details: Record<string, unknown> }> {
	const hasTarget = Boolean(String(params.target || params.url || "").trim());
	const action = params.action ?? (hasTarget ? "run" : "plan");
	let domain = "";
	try {
		domain = String(readCurrentMission()?.route?.domain ?? "");
	} catch {
		domain = "";
	}
	const nativeDomain = /Native reverse|Pwn \/ exploit|Malware analysis|Firmware/i.test(domain);
	if (action === "run" && reverseProofBound()) {
		return {
			content: [{ type: "text", text: buildNativeReverseReadyStopText(domain) }],
			details: {
				action,
				skipped: true,
				reason: "reverse_ready_stop",
				target: params.target,
				nativeDomain,
			},
		};
	}
	try {
		if (action === "run" && auditCompletion()?.ready && !nativeDomain) {
			return {
				content: [{ type: "text", text: buildNativeReverseReadyStopText(domain) }],
				details: {
					action,
					skipped: true,
					reason: "reverse_ready_stop",
					target: params.target,
				},
			};
		}
	} catch {
		/* optional */
	}
	if (action === "run") {
		if (!tryAcquireCaptureSlot("native_runtime")) {
			return {
				content: [{ type: "text", text: buildNativeReverseReadyStopText(domain) }],
				details: {
					action,
					skipped: true,
					reason: "reverse_ready_stop",
					target: params.target,
					nativeDomain,
				},
			};
		}
		markMissionReverseBound();
		softMarkReverseFromNative(`native-start:${String(params.target ?? "")}`);
		try {
			const reused = tryReuseRecentNativeRuntimeArtifact({
				target: params.target,
				latestPath: deps.latestNativeRuntimeArtifactPath?.(),
				ttlMs: 120_000,
			});
			if (reused) return buildNativeReuseResult(reused, params.target);
		} catch {
			/* optional */
		}
		const { text, coalesced } = await runNativeRuntimeCoalesced({
			target: params.target,
			run: () => deps.runNativeRuntime(pi, { target: params.target, timeoutMs: params.timeoutMs }),
		});
		try {
			const path = deps.latestNativeRuntimeArtifactPath?.();
			if (path) softMarkReverseFromNative(path);
		} catch {
			/* optional */
		}
		return buildNativeRunResult({
			text,
			coalesced,
			target: params.target,
			path: deps.latestNativeRuntimeArtifactPath?.(),
		});
	}
	const text = deps.buildNativeRuntimeOutput(action, {
		target: params.target,
		timeoutMs: params.timeoutMs,
	});
	return {
		content: [{ type: "text", text: truncateMiddle(text, 20000) }],
		details: { action, path: deps.latestNativeRuntimeArtifactPath(), target: params.target },
	};
}
