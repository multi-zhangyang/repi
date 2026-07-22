/** Browser evidence followups + reverse runtime capture gate. */

import type { LaneCommand } from "../types.ts";
import { finalizeBrowserEvidenceFollowups } from "./browser-followups-reverse.ts";
import { buildBrowserEvidenceSurfaceFollowups } from "./browser-followups-surface.ts";
import type { BrowserEvidenceSignals } from "./browser-signals.ts";

export function buildBrowserEvidenceFollowups(
	signals: BrowserEvidenceSignals,
	combined: string,
	targetArg: string,
	packTarget?: string,
): { findings: string[]; followups: LaneCommand[]; nextLane?: string } {
	const surface = buildBrowserEvidenceSurfaceFollowups(signals, combined, targetArg, packTarget);
	return finalizeBrowserEvidenceFollowups(surface);
}
