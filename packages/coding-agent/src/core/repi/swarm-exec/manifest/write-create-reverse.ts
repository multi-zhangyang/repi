/** Swarm subagent manifest reverse evidence refs. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

export function swarmManifestReverseEvidenceRefs(params: {
	worker: any;
	swarm: any;
	baseRefs: Array<string | undefined | null>;
}): string[] {
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${params.worker.worker ?? ""} ${params.worker.objective ?? ""} ${params.swarm.route ?? ""} swarm_subagent_manifest`,
		target: params.swarm.target,
		includeGates: true,
	}).slice(0, 2);
	return Array.from(
		new Set(
			[...params.baseRefs, ...reverseNext.map((cmd: any) => `reverse_next:${cmd}`)].filter((item): item is string =>
				Boolean(item),
			),
		),
	).slice(0, 32);
}
