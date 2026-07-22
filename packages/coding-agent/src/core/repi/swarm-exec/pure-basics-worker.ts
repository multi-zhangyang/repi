/** Swarm-exec pure: groups/contract/evidence helpers. */
type SwarmArtifact = any;
type SwarmWorkerRuntime = any;

export function swarmWorkerGroups(swarm: SwarmArtifact, selected: Set<string>): SwarmWorkerRuntime[][] {
	const byId = new Map(swarm.workers.map((worker: any) => [worker.id, worker]));
	const used = new Set<string>();
	const groups = swarm.parallelGroups
		.map((group: any) =>
			group
				.replace(/^group:\d+\s+/i, "")
				.split(/\s+/)
				.map((id: any) => byId.get(id))
				.filter((worker: any): worker is SwarmWorkerRuntime => Boolean(worker && selected.has(worker.id))),
		)
		.filter((group: any) => group.length > 0)
		.map((group: any) => {
			for (const worker of group) used.add(worker.id);
			return group;
		});
	const leftovers = swarm.workers.filter((worker: any) => selected.has(worker.id) && !used.has(worker.id));
	return leftovers.length ? [...groups, leftovers] : groups;
}
export function swarmContractCovered(text: string, contract: string): boolean {
	const haystack = text.toLowerCase();
	if (!contract.trim()) return true;
	if (haystack.includes(contract.toLowerCase())) return true;
	const tokens = contract.toLowerCase().match(/[a-z0-9_./:-]{4,}/g);
	if (!tokens?.length) return false;
	return tokens.some((token: any) => haystack.includes(token));
}
export function swarmWorkerEvidenceText(swarm: SwarmArtifact, worker: SwarmWorkerRuntime): string {
	const manifestRows = (swarm.subagentRuntimeManifests ?? []).filter(
		(manifest: any) => manifest.workerId === worker.id,
	);
	return [
		worker.worker,
		worker.objective,
		...worker.commands,
		...worker.mergeKeys,
		...swarm.executions
			.filter((execution: any) => execution.workerId === worker.id)
			.flatMap((execution: any) => [execution.command, execution.output]),
		...swarm.workerResults.filter(
			(result: any) => result.includes(worker.id) || result.includes(`worker=${worker.worker}`),
		),
		...swarm.mergeDigest.filter((item: any) => item.includes(worker.id) || item.includes(`worker=${worker.worker}`)),
		...manifestRows.flatMap((manifest: any) => [
			manifest.runtimeManifestFile,
			manifest.sessionDir,
			manifest.stdoutPath,
			manifest.stderrPath,
			manifest.stdoutSha256,
			manifest.stderrSha256,
			manifest.toolCallDigest,
		]),
	].join("\n");
}
