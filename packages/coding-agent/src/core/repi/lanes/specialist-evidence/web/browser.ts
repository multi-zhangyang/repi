/** Specialist evidence analyzer: web-browser. */
import type { LaneCommandPack } from "../../../lane-commands/types.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
import { buildBrowserEvidenceFollowups } from "./browser-followups.ts";
import { collectBrowserEvidenceSignals } from "./browser-signals.ts";

export function analyzeBrowserXhrWsEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/web|api/.test(pack.route.toLowerCase()) || packHasSpecialistSignal(pack, /browser-xhr-ws|browser\/XHR\/WS/i);
	if (!enabled) return { findings: [], followups: [] };
	const signals = collectBrowserEvidenceSignals(combined);
	const built = buildBrowserEvidenceFollowups(signals, combined, targetArg, pack.target);
	return {
		findings: built.findings,
		followups: built.followups,
		nextLane: built.nextLane,
	};
}
