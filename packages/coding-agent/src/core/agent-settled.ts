/**
 * agent_settled — Pi-aligned idle wait helper.
 *
 * Upstream Pi 0.80 exposes settled/idle waits so print/RPC/goal paths do not yield
 * mid-turn. REPI Agent already has `waitForIdle()` (resolves after agent_end
 * listeners). This module standardizes that contract for harness modes.
 *
 * Settlement style matches `modes/print-mode.ts` flushAssistantText (race idle vs timeout).
 */

export type AgentSettledStatus = "settled" | "timeout" | "unavailable";

export type AgentSettledTarget = {
	/** Preferred: Agent.waitForIdle() — resolves after agent_end listeners. */
	waitForIdle?: () => Promise<void>;
	/** ExtensionContext.isIdle() — true when not streaming. */
	isIdle?: () => boolean;
	/** Optional abort while polling isIdle. */
	signal?: { aborted?: boolean };
};

export type WaitForAgentSettledOptions = {
	/** Max wait in ms (default 120_000). */
	timeoutMs?: number;
	/** Poll interval when only isIdle() is available (default 25). */
	pollMs?: number;
};

/**
 * Wait until the agent is idle/settled.
 * - If waitForIdle is present: race it against timeout.
 * - Else if isIdle is present: poll until true or timeout.
 * - Else: unavailable.
 */
export async function waitForAgentSettled(
	target: AgentSettledTarget | null | undefined,
	options: WaitForAgentSettledOptions = {},
): Promise<AgentSettledStatus> {
	if (!target) return "unavailable";
	const timeoutMs = Math.max(0, options.timeoutMs ?? 120_000);
	const pollMs = Math.max(5, options.pollMs ?? 25);

	if (typeof target.waitForIdle === "function") {
		try {
			const idle = Promise.resolve(target.waitForIdle()).then(() => "settled" as const);
			if (timeoutMs === 0) return await idle;
			const settle = new Promise<AgentSettledStatus>((resolve) => {
				const t = globalThis.setTimeout(() => resolve("timeout"), timeoutMs);
				t.unref?.();
			});
			return await Promise.race([idle, settle]);
		} catch {
			return "unavailable";
		}
	}

	if (typeof target.isIdle === "function") {
		if (target.isIdle()) return "settled";
		if (timeoutMs === 0) return "timeout";
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			if (target.signal?.aborted) return "unavailable";
			if (target.isIdle()) return "settled";
			await new Promise<void>((resolve) => {
				const t = globalThis.setTimeout(resolve, pollMs);
				t.unref?.();
			});
		}
		return target.isIdle() ? "settled" : "timeout";
	}

	return "unavailable";
}

/** Build a settled target from a session-like object (`session.agent.waitForIdle`). */
export function agentSettledTargetFromSession(
	session:
		| {
				agent?: { waitForIdle?: () => Promise<void> };
				isStreaming?: boolean;
		  }
		| null
		| undefined,
): AgentSettledTarget | null {
	if (!session) return null;
	const waitForIdle = session.agent?.waitForIdle?.bind(session.agent);
	return {
		waitForIdle,
		isIdle: () => (typeof session.isStreaming === "boolean" ? !session.isStreaming : true),
	};
}

/** Build a settled target from ExtensionContext (agent_end / hooks). */
export function agentSettledTargetFromContext(
	ctx:
		| {
				isIdle?: () => boolean;
				waitForIdle?: () => Promise<void>;
				signal?: { aborted?: boolean };
		  }
		| null
		| undefined,
): AgentSettledTarget | null {
	if (!ctx) return null;
	return {
		waitForIdle: typeof ctx.waitForIdle === "function" ? () => ctx.waitForIdle!() : undefined,
		isIdle: typeof ctx.isIdle === "function" ? () => ctx.isIdle!() : undefined,
		signal: ctx.signal,
	};
}
