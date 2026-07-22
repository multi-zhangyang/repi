/** Context-pack artifact markdown body. */

import { formatContextPack } from "../context-format.ts";
import type { ContextPackArtifact } from "./types.ts";

export function buildContextPackMarkdown(pack: ContextPackArtifact, path: string): string {
	return [
		"# REPI Context Pack Artifact",
		"",
		formatContextPack(pack, path),
		"",
		"## Mission snapshot",
		"",
		"```text",
		pack.missionSnapshot,
		"```",
		"",
		"## Evidence tail",
		"",
		"```text",
		pack.evidenceTail,
		"```",
		"",
		"## Memory tail",
		"",
		"```text",
		pack.memoryTail,
		"```",
		"",
		"## Completion audit",
		"",
		"```text",
		pack.completionAudit,
		"```",
		"",
		"## JSON",
		"",
		"```json",
		JSON.stringify(pack, null, 2),
		"```",
		"",
	].join("\n");
}
