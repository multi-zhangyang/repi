/** Graph artifact pure helpers. */
import type {
	RepiProofLoopGraphExecution,
	RepiProofLoopGraphStep,
	RuntimeAdapterExecutionGraphArtifact,
} from "./types.ts";

const MITIGATION_LINE_PATTERN = /\b(NX|PIE|RELRO|Canary|FORTIFY|ASLR)\b/i;
const _NATIVE_MITIGATION_MARKER = /checksec|mitigation|relro|canary|nx|pie|fortify/i;

export function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item: any) => typeof item === "string");
}

export function stringArray(value: unknown): string[] {
	return isStringArray(value) ? value : [];
}

export function normalizeProofLoopStep(value: unknown): RepiProofLoopGraphStep | undefined {
	if (typeof value !== "object" || value === null) return undefined;
	const row = value as Record<string, unknown>;
	if (typeof row.id !== "string" || typeof row.phase !== "string" || typeof row.command !== "string") {
		return undefined;
	}
	return {
		id: row.id,
		phase: row.phase,
		command: row.command,
		status: typeof row.status === "string" ? row.status : "ready",
		reason: typeof row.reason === "string" ? row.reason : undefined,
		sourceArtifacts: stringArray(row.sourceArtifacts),
	};
}

export function normalizeProofLoopExecution(value: unknown): RepiProofLoopGraphExecution | undefined {
	if (typeof value !== "object" || value === null) return undefined;
	const row = value as Record<string, unknown>;
	if (typeof row.stepId !== "string" || typeof row.command !== "string") return undefined;
	return {
		stepId: row.stepId,
		command: row.command,
		status: typeof row.status === "string" ? row.status : "blocked",
		output: typeof row.output === "string" ? row.output : "",
	};
}

export function uniqueStrings(values: string[]): string[] {
	return Array.from(new Set(values.filter((item: any) => item.trim().length > 0)));
}

export function mitigationStreamLines(artifact: RuntimeAdapterExecutionGraphArtifact): string[] {
	return uniqueStrings(
		[artifact.stdoutHead ?? "", artifact.stderrHead ?? ""]
			.join("\n")
			.split(/\r?\n/)
			.map((line: any) => line.trim())
			.filter((line: any) => MITIGATION_LINE_PATTERN.test(line))
			.slice(0, 12),
	);
}
