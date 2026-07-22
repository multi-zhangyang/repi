/** Format lane command pack markdown. */
import type { LaneCommandPack } from "./types.ts";

export function formatLaneCommandPack(pack: LaneCommandPack): string {
	return [
		`mission_id: ${pack.missionId ?? "none"}`,
		`route: ${pack.route}`,
		`lane: ${pack.lane}`,
		`target: ${pack.target ?? "<TARGET>"}`,
		"notes:",
		...pack.notes.map((note: any) => `- ${note}`),
		"case_memory_migrations:",
		...(pack.caseMemoryMigrations?.length ? pack.caseMemoryMigrations.map((item: any) => `- ${item}`) : ["- none"]),
		"commands:",
		...pack.commands.flatMap((command, index) => [
			`## ${index + 1}. ${command.label}`,
			"```bash",
			command.command,
			"```",
			`evidence: ${command.evidence}`,
		]),
	].join("\n");
}

export function pythonString(value: string): string {
	return JSON.stringify(value);
}
