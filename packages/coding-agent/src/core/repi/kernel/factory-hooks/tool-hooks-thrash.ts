/** Reverse/completion thrash stop helpers for tool_call hooks. */
import {
	clearThrashSoftStopStreak,
	isReverseDone,
	missionCheckpoints,
	noteThrashSoftStop,
	POST_CLOSEOUT_BLOCK,
	POST_COMPLETE_HOST_BLOCK,
	POST_REVERSE_CAPTURE_BLOCK,
	PRE_CAPTURE_SIDE_BLOCK,
} from "./tool-hooks-thrash-state.ts";

export {
	clearThrashSoftStopStreak,
	isReverseDone,
	missionCheckpoints,
	noteThrashSoftStop,
	POST_CLOSEOUT_BLOCK,
	POST_COMPLETE_HOST_BLOCK,
	POST_REVERSE_CAPTURE_BLOCK,
	PRE_CAPTURE_SIDE_BLOCK,
	thrashSoftStopStreakCount,
} from "./tool-hooks-thrash-state.ts";

function thrashBlock(reason: string): { block: true; isError: false; reason: string } {
	const streak = noteThrashSoftStop();
	// After repeated soft-stops, force a single next-tool directive so models stop
	// sampling bash/ls/read/find in a loop (live: n1501-mobile, n1482-memory).
	const escalated =
		streak >= 2
			? `${reason} NEXT_ONLY after ${streak} soft-stops: follow the next tool named above; do not call bash/read/ls/find/re_techniques/re_mission again.`
			: reason;
	return { block: true, isError: false, reason: escalated };
}

export function tryThrashStopBeforeTool(params: {
	toolName: string;
	cps?: Array<{ name?: string; status?: string; note?: string }>;
	domain?: string;
	completeReady: boolean;
}): { block: true; isError: false; reason: string } | undefined {
	const toolName = String(params.toolName ?? "").trim();
	// New tasks always need re_route; never thrash-block it.
	if (!toolName || toolName === "re_route") {
		clearThrashSoftStopStreak();
		return undefined;
	}

	const cps = params.cps ?? missionCheckpoints();
	const reverseDone = isReverseDone(cps);
	const mapDone = cps.some((c) => c.name === "passive_map_done" && c.status === "done");
	const routed = cps.some((c) => c.name === "route_selected" && c.status === "done");

	if (!routed && (POST_COMPLETE_HOST_BLOCK.has(toolName) || PRE_CAPTURE_SIDE_BLOCK.has(toolName))) {
		return thrashBlock(
			"REPI capture_first: call re_route first (then re_map → domain capture); do not thrash bash/read/ls/find/re_mission/re_techniques before reverse protocol.",
		);
	}

	// After route, before map: host thrash + side tools (except re_map) are blocked.
	if (routed && !reverseDone && !mapDone) {
		if (POST_COMPLETE_HOST_BLOCK.has(toolName)) {
			return thrashBlock(
				"REPI capture_first: reverse mission — use re_map then one domain capture tool; do not thrash bash/read/ls/find first.",
			);
		}
		if (PRE_CAPTURE_SIDE_BLOCK.has(toolName) && toolName !== "re_map") {
			return thrashBlock(
				"REPI capture_first: after re_route call re_map next (not re_mission/re_techniques/re_evidence thrash).",
			);
		}
	}

	if (
		routed &&
		mapDone &&
		!reverseDone &&
		(POST_COMPLETE_HOST_BLOCK.has(toolName) || PRE_CAPTURE_SIDE_BLOCK.has(toolName))
	) {
		return thrashBlock(
			"REPI capture_first: map done — call re_runtime_adapter/re_native_runtime/re_live_browser/re_mobile_runtime once (not bash/find/re_map/re_techniques). Then re_domain_proof_exit → re_operator → re_complete.",
		);
	}

	// After route, until this process has reverse capture: do not let models skip map/capture
	// to domain_proof/operator/complete and inherit shared evidence corpus as false proof.
	if (
		routed &&
		!reverseDone &&
		(toolName === "re_domain_proof_exit" || toolName === "re_operator" || toolName === "re_complete")
	) {
		return thrashBlock(
			mapDone
				? "REPI capture_first: map done — run one domain capture (re_runtime_adapter/re_native_runtime/re_live_browser/re_mobile_runtime/re_web_authz_state/re_js_signing/re_exploit_lab) before re_domain_proof_exit/re_operator/re_complete."
				: "REPI capture_first: after re_route call re_map then one domain capture before re_domain_proof_exit/re_operator/re_complete.",
		);
	}

	if (POST_REVERSE_CAPTURE_BLOCK.has(toolName) && reverseDone) {
		return thrashBlock(
			"REPI reverse_ready_stop: reverse proof already bound. Do not thrash capture tools. Call re_operator → re_complete then output HARNESS_BUGS/PROOF only.",
		);
	}
	if (toolName === "re_map" && reverseDone && mapDone) {
		return thrashBlock(
			"REPI reverse_ready_stop: reverse proof already bound and map done. Do not thrash re_map. Call re_operator → re_complete then HARNESS_BUGS/PROOF only.",
		);
	}
	if (POST_COMPLETE_HOST_BLOCK.has(toolName) && (params.completeReady || reverseDone)) {
		return thrashBlock(
			params.completeReady
				? "REPI completion_ready_stop: reverse completion already ready. Do not thrash bash/read/write/edit/grep/find. Output HARNESS_BUGS/PROOF only (optional re_complete once)."
				: "REPI reverse_ready_stop: reverse capture already bound. Do not thrash bash/read/write/edit/grep/find. Call re_domain_proof_exit → re_operator → re_complete → HARNESS_BUGS/PROOF only.",
		);
	}
	if (params.completeReady && reverseDone && POST_CLOSEOUT_BLOCK.has(toolName)) {
		return thrashBlock(
			"REPI completion_ready_stop: reverse completion already ready. Do not thrash re_domain_proof_exit. Call re_operator plan → re_complete once (or paste plain HARNESS_BUGS:/PROOF: lines).",
		);
	}
	// Allowed tool call — reset streak so a later side thrash starts fresh.
	clearThrashSoftStopStreak();
	return undefined;
}
