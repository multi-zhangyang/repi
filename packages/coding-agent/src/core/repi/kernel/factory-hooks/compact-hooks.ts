/** Compaction session hooks. */
// Landmark: registerRepiCompactHooks lean compaction no memory product

import { registerRepiCompactAfterHook } from "./compact-hooks-after.ts";
import { registerRepiCompactBeforeHook } from "./compact-hooks-before.ts";

export function registerRepiCompactHooks(
	pi: any,
	stats: any,
	d: Record<string, any>,
	state: { compactAutoResumeBudget: number; compactAutoResumeIds: Set<string> },
): void {
	void stats;
	registerRepiCompactBeforeHook(pi, d);
	registerRepiCompactAfterHook(pi, d, state);
}
