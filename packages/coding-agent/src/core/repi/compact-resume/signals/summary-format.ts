/** Compaction details/next-command format helpers with reverse domain next. */
/** Compaction summary/contract/details helpers. */

import type { ContextPackArtifact } from "../../context-pack/types-pack.ts";
import type { AutonomousExecutionBudget } from "../../operator-format-types.ts";
import type { ReconCompactionDetails } from "../types.ts";

/** reverse: compact-resume surfaces capture gates for reverse-heavy routes */

export function reconCompactionBullets(rows: string[], fallback = "none"): string[] {
	return rows.length ? rows.map((item: any) => `- ${item}`) : [`- ${fallback}`];
}

export function buildReconCompactionDetails(
	contextPack: ContextPackArtifact,
	contextPath: string,
): ReconCompactionDetails {
	return {
		kind: "repi-compaction",
		version: 1,
		contextPath,
		missionId: contextPack.missionId,
		route: contextPack.route,
		target: contextPack.target,
		activeLane: contextPack.activeLane,
		nextCommands: contextPack.nextCommands,
		sourceArtifacts: contextPack.sourceArtifacts,
		autonomousBudget: contextPack.autonomousBudget,
		checkpointEntryType: "repi-compaction-checkpoint",
		resumeCommand: "re_context resume",
	};
}

export function parseReconCompactionDetails(details: unknown): ReconCompactionDetails | undefined {
	if (!details || typeof details !== "object") return undefined;
	const record = details as Record<string, unknown>;
	if (record.kind !== "repi-compaction") return undefined;
	if (typeof record.contextPath !== "string") return undefined;
	const nextCommands = Array.isArray(record.nextCommands)
		? record.nextCommands.filter((item): item is string => typeof item === "string")
		: [];
	const sourceArtifacts = Array.isArray(record.sourceArtifacts)
		? record.sourceArtifacts.filter((item): item is string => typeof item === "string")
		: [];
	return {
		kind: "repi-compaction",
		version: typeof record.version === "number" ? record.version : 1,
		contextPath: record.contextPath,
		missionId: typeof record.missionId === "string" ? record.missionId : undefined,
		route: typeof record.route === "string" ? record.route : undefined,
		target: typeof record.target === "string" ? record.target : undefined,
		activeLane: typeof record.activeLane === "string" ? record.activeLane : undefined,
		nextCommands,
		sourceArtifacts,
		autonomousBudget: record.autonomousBudget as AutonomousExecutionBudget,
		checkpointEntryType: "repi-compaction-checkpoint",
		resumeCommand: typeof record.resumeCommand === "string" ? record.resumeCommand : "re_context resume",
	};
}

export function reconCompactionNextCommandsFromSummary(summary: string): string[] {
	const commands = summary
		.split(/\r?\n/)
		.map((line: any) => /^-\s*next:\s*(.+)\s*$/i.exec(line)?.[1]?.trim())
		.filter((item): item is string => Boolean(item));
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|proof_exit|bind_ready|partial_runtime_capture/i.test(
			summary,
		);
	if (reverseHeavy) {
		for (const cmd of ["re_domain_proof_exit show", "re_complete audit", "re_runtime_adapter run"]) {
			if (!commands.includes(cmd)) commands.push(cmd);
		}
	}
	return commands;
}

export function contextPathFromReconCompactionSummary(summary: string): string | undefined {
	return /^-\s*contextpath:\s*(.+)\s*$/im.exec(summary)?.[1]?.trim();
}
