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

export const POST_CLOSEOUT_BLOCK = new Set(["re_domain_proof_exit", "re_operator", "re_complete", "re_js_signing"]);

export function missionCheckpoints(_d?: Record<string, any>): Array<{ name?: string; status?: string; note?: string }> {
	try {
		const mission = readCurrentMission();
		return Array.isArray(mission?.checkpoints) ? mission.checkpoints : [];
	} catch {
		return [];
	}
}

export function isReverseDone(cps?: Array<{ name?: string; status?: string; note?: string }>): boolean {
	try {
		if (isMissionReverseBound()) return true;
	} catch {
		/* optional */
	}
	const list = cps ?? missionCheckpoints();
	return list.some((c) => {
		if (!(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven")) return false;
		if (c.status === "done") return true;
		return c.status === "pending" && String(c.note ?? "").includes("runtime_adapter");
	});
}
