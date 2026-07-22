/** Attack-graph build section: mission and passive map. */

import type { AttackGraphEdge, AttackGraphNode, AttackGraphTaskTreeNode } from "../../graph.ts";
import { attackGraphMissionNodes } from "../../graph-artifacts.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphMissionMap(ctx: AttackGraphBuildCtx): void {
	if (!ctx.mission) {
		ctx.gaps.push("no active mission");
	} else {
		const seed = attackGraphMissionNodes(ctx.mission, ctx.slug);
		for (const node of seed.nodes) ctx.addNode(node as AttackGraphNode);
		for (const edge of seed.edges) ctx.addEdge(edge as AttackGraphEdge);
		for (const task of seed.taskTree) ctx.addTask(task as AttackGraphTaskTreeNode);
		ctx.gaps.push(...seed.gaps);
		ctx.criticalPath.push(...seed.criticalPath);
	}

	if (ctx.map) {
		ctx.sourceArtifacts.push(ctx.map.path);
		ctx.addNode({
			id: `map:${ctx.slug(ctx.artifactBasename(ctx.map.path))}`,
			kind: "map",
			label: ctx.map.target ?? "workspace map",
			status: `${ctx.map.signals.length} signals`,
			path: ctx.map.path,
			note: ctx.map.signals.slice(0, 5).join(" | "),
		});
		ctx.addTask({
			id: `map:${ctx.slug(ctx.artifactBasename(ctx.map.path))}`,
			parentId: ctx.mission ? `mission:${ctx.mission.id}` : undefined,
			kind: "map",
			label: ctx.map.target ?? "workspace map",
			status: `${ctx.map.signals.length} signals`,
			path: ctx.map.path,
			evidence: ctx.map.signals.slice(0, 5),
		});
		if (ctx.mission)
			ctx.addEdge({
				from: `mission:${ctx.mission.id}`,
				to: `map:${ctx.slug(ctx.artifactBasename(ctx.map.path))}`,
				kind: "evidences",
			});
	} else {
		ctx.gaps.push("no passive map artifact");
	}
}
