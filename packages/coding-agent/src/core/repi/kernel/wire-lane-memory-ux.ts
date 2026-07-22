/** Wire-lane: configureMemoryUx bag. */

import { appendMemoryEvent } from "../memory-transaction.ts";
import { configureMemoryUx } from "../memory-ux.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireMemoryUxConfigure(pick: PickFn): void {
	configureMemoryUx({
		appendMemoryEvent: pick("appendMemoryEvent", appendMemoryEvent),
	});
}
