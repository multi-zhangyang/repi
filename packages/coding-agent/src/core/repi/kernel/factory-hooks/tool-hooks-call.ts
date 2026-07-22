/** Tool call session hook: trace + loop guard. */
import { createHash } from "node:crypto";

export function registerRepiToolCallHook(pi: any, stats: any, d: Record<string, any>): void {
	const allowNoSessionReconWriteback = d.allowNoSessionReconWriteback;
	const appendToolCallTraceFromCall = d.appendToolCallTraceFromCall;
	const getBashCommand = d.getBashCommand;

	pi.on("tool_call", async (event: any) => {
		try {
			if (!stats.noSession || allowNoSessionReconWriteback()) {
				appendToolCallTraceFromCall(event, stats.currentMissionId);
			}
		} catch (error) {
			pi.appendEntry("repi-tool-call-trace-error", { timestamp: Date.now(), error: String(error).slice(0, 500) });
		}
		const command = getBashCommand(event);
		if (!command) return;
		stats.bashCalls += 1;
		const hash = createHash("sha256").update(command).digest("hex");
		stats.repeatedCommandCount = stats.lastCommandHash === hash ? stats.repeatedCommandCount + 1 : 1;
		stats.lastCommandHash = hash;
		stats.lastCommands.push(command);
		stats.lastCommands = stats.lastCommands.slice(-8);
		if (stats.active && stats.repeatedCommandCount >= 3) {
			if (!stats.selfReviewDue) stats.selfReviewNotified = false;
			stats.selfReviewDue = true;
			return {
				block: true,
				reason:
					"REPI loop guard: same bash command repeated 3 times. Run /re-self-review or change evidence surface/tool/arguments.",
			};
		}
	});
}
