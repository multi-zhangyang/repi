import type { RuntimeAdapterExecutionGraphArtifact, RuntimeAdapterLineageRow } from "./types.ts";

export function runtimeAdapterLineageForGraph(
	runtimeAdapterArtifacts: Array<{ path: string; artifact: RuntimeAdapterExecutionGraphArtifact }>,
	slug: (value: string) => string,
	artifactBasename: (path: string) => string,
): RuntimeAdapterLineageRow[] {
	return runtimeAdapterArtifacts.map(({ path, artifact }) => {
		const artifactBase = artifactBasename(path);
		return {
			path,
			artifact,
			artifactBase,
			adapterId: artifact.adapterId,
			target: artifact.target ?? "",
			artifactId: `artifact:runtime-adapter:${slug(artifact.adapterId)}:${slug(artifactBase)}`,
			commandId: `command:runtime-adapter:${slug(artifact.adapterId)}:${slug(artifactBase)}`,
		};
	});
}

/** Pure: select lineage rows relevant to a re_runtime_adapter run command. */

/** reverse: re_runtime_adapter run lineage selection for capture-bound graph nodes */
export function runtimeArtifactsForCommand(
	command: string,
	runtimeArtifactLineage: RuntimeAdapterLineageRow[],
): RuntimeAdapterLineageRow[] {
	if (!/\bre_runtime_adapter\s+run\b/i.test(command)) return [];
	const lowerCommand = command.toLowerCase();
	return runtimeArtifactLineage.filter((lineage: any) => {
		const adapterMatches = lowerCommand.includes(lineage.adapterId.toLowerCase());
		const targetMatches = lineage.target.length > 0 && lowerCommand.includes(lineage.target.toLowerCase());
		return adapterMatches || targetMatches;
	});
}
