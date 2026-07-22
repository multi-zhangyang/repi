/** Tool-index install/refresh execution. */

import { REPI_TOOL_INDEX_CANDIDATES as TOOL_INDEX_CANDIDATES } from "../profile.ts";
import { ensureReconStorage } from "../resources.ts";
import { readTextFile as readText, toolIndexPath, writePrivateTextFile } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { createBootstrapPlan, formatBootstrapPlan } from "./catalog.ts";
import { updateMissionCheckpoint } from "./deps.ts";

export async function installBootstrapTools(pi: any, tools: string[]): Promise<string> {
	const plan = createBootstrapPlan(tools);
	const pending = plan.filter((item: any) => !item.present);
	if (pending.length === 0 || pending.every((item: any) => !item.install)) {
		return `${formatBootstrapPlan(plan)}\n\n无需执行安装；所有已存在或没有内置 bootstrap 命令。`;
	}
	// Each install/verify step is made non-fatal so a single missing package or
	// failed pip/gem does not abort the whole batch (set -e previously killed the
	// entire run on the first failure). A failing step emits a manual_tool_review
	// hint naming the tool; the batch continues and the tool index is refreshed.
	const script = [
		"set -uo pipefail",
		...pending
			.filter((item: any) => item.install)
			.map(
				(item: any) =>
					`{ ${item.install!}; } || echo 'manual_tool_review ${item.tool}: install failed (non-fatal) — see REVERSER Phase 0 fallback'`,
			),
		...pending.filter((item: any) => item.verify).map((item: any) => `{ ${item.verify!}; } || true`),
	].join("\n");
	const result = await pi.exec("bash", ["-lc", script], { timeout: 600000 });
	const refreshed = await refreshToolIndex(pi);
	updateMissionCheckpoint(
		"tool_index_checked",
		result.code === 0 ? "done" : "blocked",
		`bootstrap exit=${result.code}`,
	);
	return [
		formatBootstrapPlan(plan),
		"",
		"## Bootstrap execution",
		`exit: ${result.code}`,
		result.stdout.trim() ? ["stdout:", "```", truncateMiddle(result.stdout.trim(), 6000), "```"].join("\n") : "",
		result.stderr.trim() ? ["stderr:", "```", truncateMiddle(result.stderr.trim(), 6000), "```"].join("\n") : "",
		"",
		"## Refreshed tool index tail",
		truncateMiddle(refreshed, 6000),
	]
		.filter(Boolean)
		.join("\n");
}

export async function refreshToolIndex(pi: any): Promise<string> {
	ensureReconStorage();
	const quoted = TOOL_INDEX_CANDIDATES.map((tool: any) => `'${tool.replace(/'/g, "'\\''")}'`).join(" ");
	const script = `for t in ${quoted}; do if command -v "$t" >/dev/null 2>&1; then p=$(command -v "$t"); v=$($t --version 2>&1 | head -1 | tr '\\n' ' '); printf '| %s | yes | %s | %s |\\n' "$t" "$p" "$v"; else printf '| %s | no |  |  |\\n' "$t"; fi; done; for m in angr z3; do if command -v python3 >/dev/null 2>&1 && python3 -c "import $m" >/dev/null 2>&1; then v=$(python3 -c "import $m; print(getattr($m, '__version__', 'ok'))" 2>&1 | head -1); printf '| python3:%s | yes | (module) | %s |\\n' "$m" "$v"; else printf '| python3:%s | no |  |  |\\n' "$m"; fi; done`;
	const result = await pi.exec("bash", ["-lc", script], { timeout: 20000 });
	const body = [
		"# REPI Tool Index",
		"",
		`Generated: ${new Date().toISOString()}`,
		`Command exit: ${result.code}`,
		"",
		"| Tool | Present | Path | Version probe |",
		"|---|---:|---|---|",
		result.stdout.trim(),
		"",
	].join("\n");
	// Atomic temp+rename (writePrivateTextFile, 0o600) — a crash mid-write leaves
	// either the complete prior or complete new tool-index, not a truncated one.
	// readText(toolIndexPath()) (used by buildToolDigest / re_tick routing) swallows
	// parse failure → "", so a torn write would silently degrade routing to empty.
	writePrivateTextFile(toolIndexPath(), `${body}\n`);
	return readText(toolIndexPath());
}
