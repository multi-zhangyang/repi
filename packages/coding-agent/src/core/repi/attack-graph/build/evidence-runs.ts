/** Attack-graph build section: lane evidence runs. */

import { evidenceRunsDir, recentMarkdownArtifacts } from "../../storage.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphEvidenceRuns(ctx: AttackGraphBuildCtx): void {
	for (const path of recentMarkdownArtifacts(evidenceRunsDir(), 8)) {
		ctx.sourceArtifacts.push(path);
		const text = ctx.readText(path);
		const lane = ctx.metadataValue(text, "lane") ?? ctx.artifactBasename(path);
		const verdict = ctx.metadataValue(text, "verdict");
		const score = ctx.metadataValue(text, "score");
		const runId = `run:${ctx.slug(ctx.artifactBasename(path))}`;
		ctx.addNode({
			id: runId,
			kind: "run",
			label: lane,
			status: verdict ?? "unknown",
			path,
			note: score ? `score=${score}` : undefined,
		});
		const laneId = `lane:${ctx.slug(lane)}`;
		ctx.addTask({
			id: runId,
			parentId: ctx.nodes.has(laneId) ? laneId : ctx.mission ? `mission:${ctx.mission.id}` : undefined,
			kind: "run",
			label: lane,
			status: verdict ?? "unknown",
			path,
			note: score ? `score=${score}` : undefined,
		});
		if (ctx.nodes.has(laneId)) ctx.addEdge({ from: laneId, to: runId, kind: "evidences", label: "lane-run" });
		if (verdict === "weak") ctx.gaps.push(`weak evidence run: ${path}`);
	}
}
