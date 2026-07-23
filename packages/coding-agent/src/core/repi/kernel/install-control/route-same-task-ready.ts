/** Same-task / same-domain re_route soft-stop after reverse proof is bound. */
import { isMissionReverseBound } from "../install-reverse/tools-capture-inflight.ts";

export function trySameTaskReverseReadyRouteStop(params: {
	task: string;
	route: any;
	deps: any;
}): { content: any[]; details: Record<string, unknown> } | undefined {
	try {
		const current = params.deps.readCurrentMission?.();
		if (!current) return undefined;

		const reverseDone =
			isMissionReverseBound(String(current.id ?? "")) ||
			Boolean(
				current?.checkpoints?.some((c: { name?: string; status?: string; note?: string }) => {
					if (!(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven")) return false;
					if (c.status === "done") return true;
					return c.status === "pending" && String(c.note ?? "").includes("runtime_adapter");
				}),
			);
		if (!reverseDone) return undefined;

		const curDomain = String(current.route?.domain ?? "").trim();
		const nextDomain = String(params.route?.domain ?? "").trim();
		const sameDomain = Boolean(curDomain && nextDomain && curDomain === nextDomain);

		const norm = (s: string) =>
			String(s ?? "")
				.trim()
				.toLowerCase()
				// Drop ephemeral run tags so "agent ... d264" matches sticky "agent ... d259".
				.replace(/\bd\d{2,4}\b/g, " ")
				.replace(/\s+/g, " ")
				.trim();
		const sameTask = norm(String(current.task ?? "")) === norm(params.task) && sameDomain;

		// Models re-call re_route mid-session with slightly different task text; that used to
		// create a fresh mission and wipe reverse soft-mark → adapter thrash. Same-domain
		// reverse-bound missions soft-stop instead of reset. Domain change still re-routes.
		if (!(sameTask || sameDomain)) return undefined;

		const techniqueIds = params.deps.techniqueIdsForRoute(params.route);
		const activeTools = params.deps.activateToolsForRoute?.(params.route.domain) ?? [];
		const nl = String.fromCharCode(10);
		return {
			content: [
				{
					type: "text" as const,
					text: [
						params.deps.formatRoute(params.route),
						`mission_id: ${current.id}`,
						"status: reverse_ready_stop",
						sameTask
							? "note: same-task re_route after reverse_runtime_gate; mission not reset"
							: "note: same-domain re_route after reverse_runtime_gate; mission not reset (avoid thrash wipe)",
						"next: re_operator plan/dispatch → re_complete → HARNESS_BUGS/PROOF only",
						`skill: ${params.route.skillHint}`,
						...(techniqueIds.length > 0 ? [`techniques: ${techniqueIds.join(", ")}`] : []),
						...(activeTools.length > 0 ? [`active_tools: ${activeTools.join(", ")}`] : []),
					].join(nl),
				},
			],
			details: {
				route: params.route,
				missionId: current.id,
				skipped: true,
				reason: "reverse_ready_stop",
				sameTask,
				sameDomain,
			} as Record<string, unknown>,
		};
	} catch {
		return undefined;
	}
}
