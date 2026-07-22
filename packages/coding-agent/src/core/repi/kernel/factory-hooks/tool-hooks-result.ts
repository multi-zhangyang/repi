/** Tool result session hook: deposition/self-review/recall. */
import { truncateMiddle } from "../../text.ts";

export function registerRepiToolResultHook(pi: any, stats: any, d: Record<string, any>): void {
	const allowNoSessionReconWriteback = d.allowNoSessionReconWriteback;
	const appendToolCallTraceFromResult = d.appendToolCallTraceFromResult;
	const getToolResultCommand = d.getToolResultCommand;
	const textBlocksToString = d.textBlocksToString;
	const repiMemorySettings = d.repiMemorySettings;
	const shouldAutoDepositToolResult = d.shouldAutoDepositToolResult;
	const appendMemoryDepositionRuntimeEvent = d.appendMemoryDepositionRuntimeEvent;
	const buildPerTurnMemoryRecall = d.buildPerTurnMemoryRecall;

	pi.on("tool_result", async (event: any, ctx: any) => {
		try {
			if (!stats.noSession || allowNoSessionReconWriteback()) {
				appendToolCallTraceFromResult(event, stats.currentMissionId);
			}
		} catch (error) {
			pi.appendEntry("repi-tool-result-trace-error", { timestamp: Date.now(), error: String(error).slice(0, 500) });
		}
		stats.calls += 1;
		if (event.isError) stats.failures += 1;
		const memorySettings = repiMemorySettings();
		const memoryProductOff =
			!memorySettings ||
			memorySettings.mode === "removed" ||
			memorySettings.mode === "off" ||
			memorySettings.enabled === false ||
			memorySettings.autoDepositMode === "off";
		if (
			!memoryProductOff &&
			stats.active &&
			(!stats.noSession || allowNoSessionReconWriteback()) &&
			event.toolName !== "re_note" &&
			memorySettings.autoDepositMode !== "off"
		) {
			try {
				const text = textBlocksToString(event.content);
				const command = getToolResultCommand(event);
				if (shouldAutoDepositToolResult(event, text, command, memorySettings)) {
					appendMemoryDepositionRuntimeEvent(
						{
							stage: event.toolName === "bash" ? "shell" : "tool",
							source: `tool_result:${event.toolName}`,
							status: event.isError ? "blocked" : "written",
							task: `runtime tool result: ${event.toolName}`,
							route: stats.lastRoute?.domain ?? "runtime",
							command,
							stdout: text,
							outcome: event.isError ? "failure" : "partial",
							confidence: event.isError ? 0.66 : 0.58,
							lessons: [truncateMiddle(text || `${event.toolName} completed`, 900)],
							failurePatterns: event.isError ? [truncateMiddle(text || `${event.toolName} failed`, 900)] : [],
							reuseRules: event.isError
								? []
								: [`reuse ${event.toolName} only with bound artifact/evidence hash`],
							commands: command ? [command] : [],
							reason: "high-value scoped auto writeback from REPI runtime hook",
						},
						{ writeback: true },
					);
				}
			} catch (error) {
				pi.appendEntry("repi-memory-deposition-error", {
					timestamp: Date.now(),
					error: String(error).slice(0, 500),
				});
			}
		}
		// Long-run: self-review is a lightweight checkpoint flag only (not memory inject).
		// Default every 12 tool calls; override with REPI_SELF_REVIEW_EVERY.
		const reviewEvery = (() => {
			const raw = Number.parseInt(String(process.env.REPI_SELF_REVIEW_EVERY ?? "12"), 10);
			return Number.isFinite(raw) && raw > 0 ? raw : 12;
		})();
		if (stats.active && stats.calls > 0 && stats.calls % reviewEvery === 0) {
			if (!stats.selfReviewDue) stats.selfReviewNotified = false;
			stats.selfReviewDue = true;
			if (!stats.selfReviewNotified) {
				stats.selfReviewNotified = true;
				pi.appendEntry("repi-self-review-due", {
					timestamp: Date.now(),
					calls: stats.calls,
					failures: stats.failures,
				});
				if (ctx.hasUI) ctx.ui.notify("REPI self-review checkpoint is due", "info");
			}
		}
		if (stats.active && event.toolName === "bash") {
			const text = textBlocksToString(event.content);
			if (/command not found|not recognized|No such file|cannot stat|ModuleNotFoundError|ImportError/i.test(text)) {
				if (!stats.selfReviewDue) stats.selfReviewNotified = false;
				stats.selfReviewDue = true;
			}
		}
		// Memory product removed: never append per-turn recall blobs into tool results.
		if (!memoryProductOff && stats.active && memorySettings.autoRecall === true) {
			const recall = buildPerTurnMemoryRecall(event, stats);
			if (typeof recall === "string" && recall.trim()) {
				return { content: [...event.content, { type: "text" as const, text: recall }] };
			}
		}
	});
}
