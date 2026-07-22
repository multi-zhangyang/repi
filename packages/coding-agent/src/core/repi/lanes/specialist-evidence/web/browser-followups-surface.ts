/** Browser evidence surface followups (authz/cdp/ws/replay). */
import type { LaneCommand } from "../types.ts";
import { pushBrowserAuthzFollowups } from "./browser-followups-authz.ts";
import { pushBrowserCaptureFollowups } from "./browser-followups-capture.ts";
import type { BrowserEvidenceSignals } from "./browser-signals.ts";

export function buildBrowserEvidenceSurfaceFollowups(
	signals: BrowserEvidenceSignals,
	combined: string,
	targetArg: string,
	packTarget?: string,
): {
	findings: string[];
	followups: LaneCommand[];
	combined: string;
	targetArg: string;
	packTarget?: string;
	runtimeLines: string[];
	websocketAnchors: string[];
	cdpLines: string[];
	replayLines: string[];
	routeGraphLines: string[];
	authMatrixLines: string[];
	idorProbeLines: string[];
} {
	const findings = [...signals.findings];
	const followups: LaneCommand[] = [];
	const { runtimeLines, websocketAnchors, cdpLines, replayLines, routeGraphLines, authMatrixLines, idorProbeLines } =
		signals;

	pushBrowserCaptureFollowups(followups, signals, targetArg, packTarget);
	pushBrowserAuthzFollowups(followups, signals, targetArg, packTarget);

	return {
		findings,
		followups,
		combined,
		targetArg,
		packTarget,
		runtimeLines,
		websocketAnchors,
		cdpLines,
		replayLines,
		routeGraphLines,
		authMatrixLines,
		idorProbeLines,
	};
}
