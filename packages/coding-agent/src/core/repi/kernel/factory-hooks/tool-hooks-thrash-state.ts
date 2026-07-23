/** Shared thrash state helpers and block sets. */
import { readCurrentMission } from "../../mission.ts";
import { isMissionReverseBound } from "../install-reverse/tools-capture-inflight.ts";

export const POST_REVERSE_CAPTURE_BLOCK = new Set([
	"re_runtime_adapter",
	"re_native_runtime",
	"re_mobile_runtime",
	"re_live_browser",
	"re_web_authz_state",
	"re_js_signing",
	"re_exploit_lab",
	"re_bootstrap",
	"re_tool_index",
	"re_lane",
	"re_evidence",
	"re_mission",
	"re_techniques",
]);

export const POST_COMPLETE_HOST_BLOCK = new Set(["bash", "read", "grep", "find", "ls", "write", "edit"]);

export const PRE_CAPTURE_SIDE_BLOCK = new Set([
	"re_techniques",
	"re_mission",
	"re_tool_index",
	"re_lane",
	"re_evidence",
	"re_map",
]);

/** re_operator/re_complete keep tool-level ready-stop; thrash only stops domain-proof thrash. */
export const POST_CLOSEOUT_BLOCK = new Set(["re_domain_proof_exit"]);

export function missionCheckpoints(_d?: Record<string, any>): Array<{ name?: string; status?: string; note?: string }> {
	try {
		const mission = readCurrentMission();
		return Array.isArray(mission?.checkpoints) ? mission.checkpoints : [];
	} catch {
		return [];
	}
}

export function isReverseDone(_cps?: Array<{ name?: string; status?: string; note?: string }>): boolean {
	// Process-local session bind only. Disk checkpoint done/pending from prior --no-session
	// processes must NOT block a fresh run's first capture (shared ~/.repi mission file).
	try {
		return isMissionReverseBound();
	} catch {
		return false;
	}
}
