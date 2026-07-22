/** before_agent_start body for long-run lean cold-start. */
// Landmark: reverse sticky cold-start coldStartInjected repi_inject sticky-v1
import { activateRepiToolsForRoute } from "../harness-modes.ts";
import { buildRepiColdStartSystemPrompt } from "./agent-hooks-run-cold.ts";
import {
	buildStickyRuntimeLine,
	promptLooksLikeContinuation,
	sameRouteDomain,
	shouldCreateStickyMission,
} from "./agent-hooks-sticky.ts";

export async function runRepiBeforeAgentStart(
	event: any,
	ctx: any,
	pi: any,
	stats: any,
	d: Record<string, any>,
): Promise<{ systemPrompt: string } | undefined> {
	const isSecurityTask = d.isSecurityTask;
	const routeReconTask = d.routeReconTask;
	const createMission = d.createMission;
	const writeCurrentMission = d.writeCurrentMission;
	const readCurrentMission = d.readCurrentMission;
	const truncateMiddle = d.truncateMiddle;
	const formatRoute = d.formatRoute;
	const makeSelfReview = d.makeSelfReview;

	const prompt = String(event.prompt ?? "");
	const forceFullPacket =
		process.env.REPI_COLD_START_EVERY_TURN === "1" || process.env.REPI_COLD_START_EVERY_TURN === "true";
	const stickyMission = typeof readCurrentMission === "function" ? readCurrentMission() : undefined;
	const securityNow = isSecurityTask(prompt);
	const continuation = promptLooksLikeContinuation(prompt);
	if (!securityNow && !stickyMission?.id) return undefined;

	const route = securityNow
		? routeReconTask(prompt)
		: (stickyMission?.route ?? stats.lastRoute ?? routeReconTask(prompt || stickyMission?.task || "repi"));
	const domainChanged =
		Boolean(stickyMission?.route) &&
		securityNow &&
		!continuation &&
		prompt.length >= 64 &&
		!sameRouteDomain(stickyMission.route, route);
	const shouldCreateMission = shouldCreateStickyMission({
		stickyMission,
		route,
		securityNow,
		continuation,
		prompt,
		domainChanged,
	});
	const mission = shouldCreateMission
		? writeCurrentMission(createMission(prompt || stickyMission?.task || "repi-sticky-mission", route))
		: stickyMission;
	const missionColdDone = Boolean((mission as any)?.coldStartInjected);
	const needFullColdStart = forceFullPacket || shouldCreateMission || domainChanged || !missionColdDone;

	stats.active = true;
	stats.lastRoute = route;
	stats.currentMissionId = mission.id;
	stats.sessionFile = ctx.sessionManager?.getSessionFile?.();
	stats.noSession = Boolean(ctx.sessionManager) && !stats.sessionFile;
	stats.coldStartInjected = !needFullColdStart || missionColdDone;
	stats.coldStartRouteDomain = route.domain;

	if (shouldCreateMission || domainChanged || needFullColdStart) {
		pi.appendEntry("repi-route", {
			timestamp: Date.now(),
			route,
			prompt: truncateMiddle(prompt, 500),
			sticky: !shouldCreateMission,
			inject: needFullColdStart ? "cold-start-lean" : "sticky",
		});
		pi.appendEntry("repi-mission", {
			timestamp: Date.now(),
			missionId: mission.id,
			created: shouldCreateMission,
		});
	}
	if (!pi.getSessionName()) pi.setSessionName(`REPI: ${route.domain}`);
	if (ctx.hasUI) ctx.ui.setStatus("repi", formatRoute(route));

	const activeTools = activateRepiToolsForRoute(route.domain, ctx);
	if (!needFullColdStart) {
		const sticky = buildStickyRuntimeLine({ route, mission, stats, formatRoute, activeTools });
		const selfReview =
			stats.selfReviewDue && typeof makeSelfReview === "function" ? `\n\n${makeSelfReview(stats)}` : "";
		if (stats.selfReviewDue) {
			stats.selfReviewDue = false;
			stats.selfReviewNotified = false;
		}
		return { systemPrompt: `${event.systemPrompt}\n\n${sticky}${selfReview}` };
	}

	return buildRepiColdStartSystemPrompt({
		event,
		route,
		mission,
		prompt,
		stats,
		activeTools,
		writeCurrentMission,
		d,
	});
}
