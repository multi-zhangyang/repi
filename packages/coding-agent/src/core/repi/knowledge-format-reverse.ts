/** Knowledge-graph reverse domain next section. */

import type { KnowledgeGraphFormatView } from "./knowledge-format-types.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function knowledgeGraphReverseNextLines(graph: KnowledgeGraphFormatView): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${graph.route ?? ""} ${graph.target ?? ""} ${graph.query ?? ""} ${graph.nextActions.join(" ")}`,
		);
	if (!reverseHeavy) return [];
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${graph.route ?? ""} ${graph.target ?? ""} knowledge_graph`,
		target: graph.target,
		includeGates: true,
	}).slice(0, 2);
	return reverseNext.length ? ["reverse_domain_next:", ...reverseNext.map((cmd: any) => `- next: ${cmd}`)] : [];
}
