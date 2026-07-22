import { evidenceSwarmsDir, readTextFile, recentMarkdownArtifacts } from "../storage.ts";
import type { SwarmGraphArtifact } from "./types.ts";

export function parseSwarmArtifact(path: string): SwarmGraphArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readTextFile(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as SwarmGraphArtifact;
	} catch {
		return undefined;
	}
}

export function recentSwarmArtifactsForGraph(limit = 4): Array<{ path: string; swarm: SwarmGraphArtifact }> {
	return recentMarkdownArtifacts(evidenceSwarmsDir(), limit)
		.map((path: any) => {
			const swarm = parseSwarmArtifact(path);
			return swarm ? { path, swarm } : undefined;
		})
		.filter((item): item is { path: string; swarm: SwarmGraphArtifact } => Boolean(item));
}
