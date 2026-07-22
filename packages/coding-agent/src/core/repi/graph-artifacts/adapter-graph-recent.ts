/** Runtime-adapter graph recent artifacts + type guard. */
/** Runtime-adapter graph evidence helpers. */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { evidenceToolchainDir, readJsonObjectFile } from "../storage.ts";
import type { RuntimeAdapterExecutionGraphArtifact } from "./types.ts";

export function isRuntimeAdapterExecutionGraphArtifact(row: unknown): row is RuntimeAdapterExecutionGraphArtifact {
	if (typeof row !== "object" || row === null) return false;
	const record = row as Record<string, unknown>;
	return (
		record.kind === "RuntimeAdapterExecutionArtifactV1" &&
		record.schemaVersion === 1 &&
		typeof record.adapterId === "string" &&
		typeof record.domainId === "string" &&
		typeof record.bridgeId === "string" &&
		typeof record.startedAt === "string" &&
		typeof record.finishedAt === "string" &&
		typeof record.command === "string" &&
		typeof record.stdoutSha256 === "string" &&
		typeof record.stderrSha256 === "string" &&
		Array.isArray(record.parserSignals) &&
		Array.isArray(record.artifactKinds) &&
		Array.isArray(record.ingestTargets) &&
		Array.isArray(record.proofExitSignals)
	);
}

export function recentRuntimeAdapterExecutionArtifacts(
	limit = 8,
): Array<{ path: string; artifact: RuntimeAdapterExecutionGraphArtifact }> {
	const root = join(evidenceToolchainDir(), "runtime-adapters");
	try {
		return readdirSync(root, { withFileTypes: true })
			.filter((entry: any) => entry.isDirectory())
			.flatMap((entry: any) => {
				const dir = join(root, entry.name);
				return readdirSync(dir, { withFileTypes: true })
					.filter((file: any) => file.isFile() && file.name.endsWith(".json"))
					.map((file: any) => {
						const path = join(dir, file.name);
						let mtimeMs = 0;
						try {
							mtimeMs = statSync(path).mtimeMs;
						} catch {
							mtimeMs = 0;
						}
						return { path, mtimeMs };
					});
			})
			.sort((left: any, right: any) => right.mtimeMs - left.mtimeMs || right.path.localeCompare(left.path))
			.slice(0, limit)
			.map(({ path }) => {
				const artifact = readJsonObjectFile<unknown>(path);
				return isRuntimeAdapterExecutionGraphArtifact(artifact) ? { path, artifact } : undefined;
			})
			.filter((item): item is { path: string; artifact: RuntimeAdapterExecutionGraphArtifact } => Boolean(item));
	} catch {
		return [];
	}
}
