/** Knowledge-graph artifact source inventory. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import {
	evidenceAutofixDir,
	evidenceBrowserDir,
	evidenceCampaignsDir,
	evidenceChainsDir,
	evidenceCompilersDir,
	evidenceContextsDir,
	evidenceDecisionsDir,
	evidenceDelegationsDir,
	evidenceExploitLabDir,
	evidenceGraphsDir,
	evidenceMapsDir,
	evidenceMobileRuntimeDir,
	evidenceNativeRuntimeDir,
	evidenceOperationsDir,
	evidenceOperatorsDir,
	evidenceProofLoopsDir,
	evidenceReflectionsDir,
	evidenceReplayersDir,
	evidenceRunsDir,
	evidenceSupervisorsDir,
	evidenceSwarmsDir,
	evidenceVerifiersDir,
	evidenceWebAuthzDir,
	readTextFile as readText,
	recentMarkdownArtifacts,
} from "../storage.ts";
import { truncateMiddle } from "../text.ts";

export function knowledgeArtifactSources(limitPerKind = 5): Array<{ kind: string; path: string; text: string }> {
	const specs: Array<[string, string]> = [
		["map", evidenceMapsDir()],
		["browser", evidenceBrowserDir()],
		["web_authz", evidenceWebAuthzDir()],
		["exploit_lab", evidenceExploitLabDir()],
		["mobile_runtime", evidenceMobileRuntimeDir()],
		["native_runtime", evidenceNativeRuntimeDir()],
		["run", evidenceRunsDir()],
		["attack_graph", evidenceGraphsDir()],
		["exploit_chain", evidenceChainsDir()],
		["decision_core", evidenceDecisionsDir()],
		["campaign", evidenceCampaignsDir()],
		["operation", evidenceOperationsDir()],
		["delegation", evidenceDelegationsDir()],
		["swarm", evidenceSwarmsDir()],
		["supervisor", evidenceSupervisorsDir()],
		["reflection", evidenceReflectionsDir()],
		["context", evidenceContextsDir()],
		["operator", evidenceOperatorsDir()],
		["verifier", evidenceVerifiersDir()],
		["compiler", evidenceCompilersDir()],
		["replayer", evidenceReplayersDir()],
		["autofix", evidenceAutofixDir()],
		["proof_loop", evidenceProofLoopsDir()],
	];
	const sources = specs.flatMap(([kind, dir]) =>
		recentMarkdownArtifacts(dir, limitPerKind).map((path: any) => ({
			kind,
			path,
			text: truncateMiddle(readText(path), 7000),
		})),
	);
	// reverse-heavy source kinds seed capture next into text for downstream KG routing
	return sources.map((source: any) => {
		if (
			!/native_runtime|mobile_runtime|exploit_lab|web_authz|browser|proof_loop|malware|firmware/i.test(source.kind)
		) {
			return source;
		}
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${source.kind} ${source.path}`,
			includeGates: true,
		}).slice(0, 1);
		if (!reverseNext.length) return source;
		return {
			...source,
			text: `${source.text}
reverse_next: ${reverseNext[0]}`,
		};
	});
}
