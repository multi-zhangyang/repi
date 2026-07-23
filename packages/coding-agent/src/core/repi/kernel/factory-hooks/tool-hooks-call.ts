/** Tool call session hook: trace + loop guard + reverse/completion thrash stop. */
import { createHash } from "node:crypto";
import { isMissionReverseBound } from "../install-reverse/tools-capture-inflight.ts";
import { missionCheckpoints, tryThrashStopBeforeTool } from "./tool-hooks-thrash.ts";

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

		const toolName = String(event?.toolName ?? event?.name ?? event?.tool?.name ?? "").trim();
		const cps = missionCheckpoints();
		let completeReady = false;
		try {
			const audit = typeof d.auditCompletion === "function" ? d.auditCompletion() : undefined;
			const reverseDone = isMissionReverseBound();
			completeReady =
				audit?.ready === true ||
				(reverseDone &&
					cps.some(
						(c) =>
							(c.name === "report_or_writeup_ready" || c.name === "completion_audit_ready") &&
							c.status === "done",
					));
		} catch {
			completeReady = false;
		}
		const thrash = tryThrashStopBeforeTool({ toolName, cps, completeReady });
		if (thrash) return thrash;

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
