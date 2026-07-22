/** Knowledge-graph write reverse next merge. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { KnowledgeGraphArtifact } from "./types.ts";

export function withKnowledgeGraphReverseNext(graph: KnowledgeGraphArtifact): KnowledgeGraphArtifact {
	const reverseBlob = `${graph.route ?? ""} ${graph.target ?? ""} ${(graph.nextActions ?? []).join(" ")}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		)
	) {
		return graph;
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: graph.target,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return graph;
	return {
		...graph,
		nextActions: Array.from(new Set([...(graph.nextActions ?? []), ...reverseNext])).slice(0, 24),
	};
}
