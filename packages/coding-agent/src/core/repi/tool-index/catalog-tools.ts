/** Tool-index command tool probes and missing-tool queries. */

import { REPI_TOOL_INDEX_CANDIDATES as TOOL_INDEX_CANDIDATES } from "../profile.ts";
import { escapeRegExp, shellQuote } from "../target.ts";
import { repiResolvedToolPresent } from "../tool-presence.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG as TOOL_BOOTSTRAP_CATALOG } from "../toolchain.ts";
import { CATALOG_COMMAND_TOOL_PROBES } from "./catalog-tools-probes.ts";

export function toolsFromCommand(command: string): string[] {
	const firstToken = command.trim().split(/\s+/)[0]?.replace(/['"`]/g, "");
	const tools = new Set<string>();
	if (
		firstToken &&
		!/^(set|echo|cat|sed|awk|grep|head|tail|find|for|if|then|else|fi|while|do|done|export|cd|pwd|ls|printf|case|esac)$/.test(
			firstToken,
		)
	) {
		tools.add(firstToken);
	}
	for (const tool of CATALOG_COMMAND_TOOL_PROBES) {
		if (new RegExp(`(^|[^A-Za-z0-9_.-])${escapeRegExp(tool)}([^A-Za-z0-9_.-]|$)`).test(command)) tools.add(tool);
	}
	return Array.from(tools);
}

export function knownReconTool(tool: string): boolean {
	const lower = tool.toLowerCase();
	return (
		TOOL_INDEX_CANDIDATES.some((candidate: any) => candidate.toLowerCase() === lower) ||
		TOOL_BOOTSTRAP_CATALOG.some((entry: any) => entry.tool.toLowerCase() === lower) ||
		["aapt", "unzip", "ldd", "curl", "rg", "python", "python3"].includes(lower)
	);
}

export function commandKnownTools(command: string): string[] {
	return toolsFromCommand(command).filter((tool: any) => knownReconTool(tool));
}

export function missingToolsForCommand(
	command: string,
	index: Map<string, { present: boolean; path?: string }>,
): string[] {
	return commandKnownTools(command).filter((tool: any) => repiResolvedToolPresent(index, tool) === false);
}

export function targetArgForPack(pack: any): string {
	return pack.target ? shellQuote(pack.target) : "<TARGET>";
}

export function replacementIfToolsAvailable(
	index: Map<string, { present: boolean; path?: string }>,
	tools: string[],
): boolean {
	return tools.some((tool: any) => repiResolvedToolPresent(index, tool) === true);
}
