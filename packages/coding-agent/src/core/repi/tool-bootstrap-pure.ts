/** Tool-bootstrap pure helpers. */

import { splitMetadataList } from "./lane-run-mission.ts";
import { readCurrentMission, writeCurrentMission } from "./mission.ts";
import { metadataValue, truncateMiddle } from "./text.ts";
import { upsertMissionCheckpoint } from "./tool-bootstrap-deps.ts";

export function adaptiveSourceLaneName(lane: any): string | undefined {
	const match = /(?:^|;\s*)adaptive_from=([^;]+)/.exec(lane.note ?? "");
	const source = match?.[1]?.trim();
	return source || undefined;
}

export function normalizeBootstrapToolToken(token: string): string | undefined {
	const normalized = token.replace(/^[`'"]+|[`'",;]+$/g, "").trim();
	if (!normalized || /^(re_bootstrap|plan|install|none)$/i.test(normalized)) return undefined;
	return normalized;
}

export function bootstrapToolsFromLane(lane: any, text: string): string[] {
	const tools: string[] = [];
	const add = (value?: string) => {
		for (const item of splitMetadataList(value)) {
			const tool = normalizeBootstrapToolToken(item);
			if (tool && !tools.includes(tool)) tools.push(tool);
		}
	};
	const combined = [lane.note ?? "", lane.next.join("\n"), text].join("\n");
	for (const match of combined.matchAll(/\bre_bootstrap\s+(?:plan|install)\s+([^\n#]+)/g)) {
		add(match[1]);
	}
	add(metadataValue(text, "missing_tools"));
	for (const match of combined.matchAll(/missing_tools:\s*([^\n]+)/g)) {
		add(match[1]);
	}
	return tools.slice(0, 16);
}

export function markToolBootstrapClosure(params: {
	laneName: string;
	sourceLane?: string;
	tools: string[];
	missing: string[];
	refreshedPath: string;
}): void {
	const mission = readCurrentMission();
	if (!mission) return;
	const timestamp = new Date().toISOString();
	const installCommand = params.missing.length > 0 ? `re_bootstrap install ${params.missing.join(" ")}` : undefined;
	const lanes = mission.lanes.map((lane: any) => {
		if (lane.name === params.laneName) {
			const next = [...lane.next];
			if (installCommand && !next.includes(installCommand)) next.unshift(installCommand);
			return {
				...lane,
				status: params.missing.length > 0 ? ("in_progress" as const) : ("done" as const),
				next,
				note: truncateMiddle(
					[
						params.missing.length > 0 ? "bootstrap_incomplete" : "bootstrap_closed",
						`tools=${params.tools.join(",") || "none"}`,
						params.missing.length > 0 ? `missing=${params.missing.join(",")}` : "missing=none",
						params.sourceLane ? `resume=${params.sourceLane}` : undefined,
					]
						.filter(Boolean)
						.join("; "),
					500,
				),
				updatedAt: timestamp,
			};
		}
		if (params.missing.length === 0 && params.sourceLane && lane.name === params.sourceLane) {
			return {
				...lane,
				status: "in_progress" as const,
				note: truncateMiddle(
					`bootstrap_resumed_from=${params.laneName}; tools=${params.tools.join(",") || "none"}; tool_index=${params.refreshedPath}`,
					500,
				),
				updatedAt: timestamp,
			};
		}
		if (params.missing.length === 0 && lane.status === "in_progress") {
			return { ...lane, status: "pending" as const, updatedAt: timestamp };
		}
		return lane;
	});
	const checkpoints = upsertMissionCheckpoint(
		mission.checkpoints,
		"tool_index_checked",
		params.missing.length > 0 ? "blocked" : "done",
		params.missing.length > 0
			? `missing after bootstrap refresh: ${params.missing.join(", ")}`
			: `bootstrap closure refreshed ${params.refreshedPath}`,
	);
	writeCurrentMission({ ...mission, lanes, checkpoints });
}
