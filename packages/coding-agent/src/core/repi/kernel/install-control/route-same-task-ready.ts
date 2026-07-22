/** Same-task re_route soft-stop after reverse proof is bound. */
export function trySameTaskReverseReadyRouteStop(params: {
	task: string;
	route: any;
	deps: any;
}): { content: any[]; details: Record<string, unknown> } | undefined {
	try {
		const current = params.deps.readCurrentMission?.();
		const sameTask =
			current &&
			String(current.task ?? "")
				.trim()
				.toLowerCase() === params.task.toLowerCase() &&
			String(current.route?.domain ?? "") === String(params.route.domain ?? "");
		const reverseDone = Boolean(
			current?.checkpoints?.some(
				(c: { name?: string; status?: string }) =>
					(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
			),
		);
		if (!(sameTask && reverseDone)) return undefined;
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
						"note: same-task re_route after reverse_runtime_gate; mission not reset",
						"next: write HARNESS_BUGS/PROOF only",
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
			} as Record<string, unknown>,
		};
	} catch {
		return undefined;
	}
}
