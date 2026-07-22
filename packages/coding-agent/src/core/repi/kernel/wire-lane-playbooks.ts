/** Wire-lane: configurePlaybooks bag. */

import { configurePlaybooks, normalizeHistoricalCommand } from "../playbooks-deps.ts";
import type { PickFn } from "./wire-pick.ts";

export function wirePlaybooksConfigure(pick: PickFn): void {
	configurePlaybooks({
		normalizeHistoricalCommand: pick("normalizeHistoricalCommand", normalizeHistoricalCommand),
	});
}
