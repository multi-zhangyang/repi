/** Attack-graph build section: tools and next-actions nodes. */

import { createBootstrapPlan, recommendedToolsForRoute } from "../deps.ts";
import { attackGraphNextActions } from "../next-actions.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphFinalize(ctx: AttackGraphBuildCtx): void {
	if (ctx.mission) {
		const recommended = recommendedToolsForRoute(ctx.mission.route).slice(0, 16);
		const missing = recommended
			.map((tool: any) => createBootstrapPlan([tool])[0])
			.filter(
				(item): item is { tool: string; known: boolean; present: boolean } =>
					Boolean(item) && item.known && !item.present,
			)
			.map((item: any) => item.tool);
		ctx.addNode({
			id: "tool:recommended",
			kind: "tool",
			label: recommended.join(", ") || "none",
			status: missing.length ? `missing:${missing.join(",")}` : "ready",
		});
		ctx.addEdge({ from: `mission:${ctx.mission.id}`, to: "tool:recommended", kind: "requires", label: "tool-index" });
		if (missing.length > 0) ctx.gaps.push(`missing recommended tools: ${missing.join(", ")}`);
	}

	ctx.nextActions = attackGraphNextActions(ctx.mission, ctx.map);
	for (const [index, action] of ctx.nextActions.entries()) {
		const id = `next:${index + 1}`;
		ctx.addNode({ id, kind: "next", label: action, status: "queued" });
		ctx.addTask({
			id,
			parentId: ctx.mission ? `mission:${ctx.mission.id}` : undefined,
			kind: "next",
			label: action,
			status: "queued",
			command: action,
		});
		if (ctx.mission) ctx.addEdge({ from: `mission:${ctx.mission.id}`, to: id, kind: "suggests" });
	}
}
