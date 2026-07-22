/** Recent markdown artifact helpers. */
import { readdirSync } from "node:fs";
import { join } from "node:path";

export function recentMarkdownArtifacts(dir: string, limit: number): string[] {
	try {
		return readdirSync(dir)
			.filter((file: any) => file.endsWith(".md"))
			.sort()
			.reverse()
			.slice(0, limit)
			.map((file: any) => join(dir, file));
	} catch {
		return [];
	}
}

export function artifactBasename(path: string): string {
	return path.split(/[/\\]/).pop() ?? path;
}
