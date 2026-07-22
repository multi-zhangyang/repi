import { join } from "node:path";
/** Attack-graph write/parse/output helpers. */
import { type AttackGraphArtifact, formatAttackGraph, formatAttackGraphArtifactMarkdown } from "../graph.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceGraphsDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildAttackGraph } from "./build.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { latestAttackGraphArtifactPath } from "./next-actions.ts";

export function writeAttackGraphArtifact(graph: AttackGraphArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceGraphsDir(),
		`${graph.timestamp.replace(/[:.]/g, "-")}-${slug(graph.route ?? "security")}.md`,
	);
	writePrivateTextFile(path, formatAttackGraphArtifactMarkdown(graph, { truncate: truncateMiddle }));
	const evidence = appendEvidence({
		kind: "artifact",
		title: `attack-graph ${graph.missionId ?? "no-mission"}`,
		fact: `Built operation graph with ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.gaps.length} gap(s), ${graph.nextActions.length} next action(s)`,
		command: "re_graph build",
		path,
		verify: `cat ${path}`,
		confidence: "mission/evidence/tool graph",
	});
	updateMissionCheckpoint("attack_graph_ready", "done", path);
	return `${path}\n${evidence.timestamp} ${evidence.title}`;
}

export function buildAttackGraphOutput(action: "build" | "show" = "build"): string {
	if (action === "show") {
		const path = latestAttackGraphArtifactPath();
		if (!path) return "attack_graph:\nstatus: missing\nnext: re_graph build";
		return truncateMiddle(readText(path), 12000);
	}
	const graph = buildAttackGraph();
	const writeResult = writeAttackGraphArtifact(graph);
	const [path] = writeResult.split(/\r?\n/, 1);
	return formatAttackGraph(graph, path);
}

export function parseAttackGraphArtifact(path: string): AttackGraphArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		const parsed = JSON.parse(match[1]) as Partial<AttackGraphArtifact>;
		return Array.isArray(parsed.nodes) &&
			Array.isArray(parsed.edges) &&
			Array.isArray(parsed.taskTree) &&
			Array.isArray(parsed.gaps)
			? (parsed as AttackGraphArtifact)
			: undefined;
	} catch {
		return undefined;
	}
}
