/** Tool-index digest/bootstrap plan pure helpers. */
import { ensureReconStorage } from "../resources.ts";
import { readTextFile as readText, toolIndexPath } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG as TOOL_BOOTSTRAP_CATALOG } from "../toolchain.ts";
import type { BootstrapCatalogEntry, BootstrapPlan } from "./types.ts";

export function buildToolDigest(): string {
	ensureReconStorage();
	const text = readText(toolIndexPath()).trim();
	return text ? truncateMiddle(text, 1600) : "工具索引为空；优先调用 re_tool_index refresh。";
}

export function parseToolIndex(): Map<string, { present: boolean; path?: string }> {
	ensureReconStorage();
	const rows = new Map<string, { present: boolean; path?: string }>();
	for (const line of readText(toolIndexPath()).split(/\r?\n/)) {
		const match = /^\|\s*([^|]+?)\s*\|\s*(yes|no)\s*\|\s*([^|]*?)\s*\|/i.exec(line);
		if (!match) continue;
		const tool = match[1]?.trim();
		if (!tool || tool === "Tool") continue;
		rows.set(tool, { present: match[2]?.toLowerCase() === "yes", path: match[3]?.trim() || undefined });
	}
	return rows;
}

export function bootstrapCatalogFor(tool: string): BootstrapCatalogEntry | undefined {
	return TOOL_BOOTSTRAP_CATALOG.find((entry: any) => entry.tool.toLowerCase() === tool.toLowerCase());
}

export function createBootstrapPlan(tools: string[]): BootstrapPlan[] {
	const index = parseToolIndex();
	return tools.map((tool: any) => {
		const indexed = index.get(tool);
		const catalog = bootstrapCatalogFor(tool);
		return {
			tool,
			present: indexed?.present ?? false,
			path: indexed?.path,
			install: catalog?.install,
			verify: catalog?.verify,
			known: catalog !== undefined,
		};
	});
}

export function formatBootstrapPlan(plan: BootstrapPlan[]): string {
	if (plan.length === 0) return "未指定工具。用 re_bootstrap plan/install 并传入 tools。";
	return [
		"| Tool | Present | Path | Known bootstrap | Install | Verify |",
		"|---|---:|---|---:|---|---|",
		...plan.map(
			(item: any) =>
				`${[
					`| ${item.tool}`,
					item.present ? "yes" : "no",
					item.path ?? "",
					item.known ? "yes" : "no",
					item.install ? `\`${item.install.replace(/`/g, "\\`")}\`` : "",
					item.verify ? `\`${item.verify.replace(/`/g, "\\`")}\`` : "",
				].join(" | ")} |`,
		),
	].join("\n");
}
