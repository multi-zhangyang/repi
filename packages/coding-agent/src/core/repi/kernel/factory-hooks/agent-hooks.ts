/** Session start + before_agent_start cold-start hooks (long-run lean). */
// Landmark: reverse sticky cold-start coldStartInjected repi_inject sticky-v1
import { runRepiBeforeAgentStart } from "./agent-hooks-run.ts";

/**
 * Long-run inject policy:
 * - Full lean cold-start packet ONCE per mission/domain (first security turn).
 * - Later turns / process restarts with same mission: tiny sticky binder only.
 * - Never mint a new mission for short continuations / auto-resume / goal continue.
 */
export function registerRepiAgentHooks(pi: any, stats: any, d: Record<string, any>): void {
	const ensureReconStorage = d.ensureReconStorage;

	pi.on("session_start", async (_event: any, ctx: any) => {
		ensureReconStorage();
		if (ctx.hasUI) ctx.ui.setStatus("repi", "REPI kernel profile ready");
	});

	pi.on("before_agent_start", async (event: any, ctx: any) => {
		return runRepiBeforeAgentStart(event, ctx, pi, stats, d);
	});
}
