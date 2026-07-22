/** Persist swarm claim ledger / manifest index / markdown artifact. */

import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import { formatSwarm } from "../../swarm-format.ts";
import type { SwarmArtifact } from "../types.ts";
import { withSwarmArtifactReverseNext } from "./write-artifact-reverse.ts";

export function persistSwarmRuntimeArtifacts(swarm: SwarmArtifact, path: string): void {
	if (swarm.claimLedgerPath) {
		atomicWriteFileSync(
			swarm.claimLedgerPath,
			`${(swarm.claimLedger ?? []).map((event: any) => JSON.stringify(event)).join("\n")}${(swarm.claimLedger ?? []).length ? "\n" : ""}`,
			0o644,
		);
	}
	if (swarm.structuredClaimMergePath && swarm.structuredClaimMerge) {
		atomicWriteFileSync(
			swarm.structuredClaimMergePath,
			`${JSON.stringify(withSwarmArtifactReverseNext(swarm).structuredClaimMerge, null, 2)}\n`,
			0o644,
		);
	}
	if (swarm.subagentRuntimeManifestPath) {
		atomicWriteFileSync(
			swarm.subagentRuntimeManifestPath,
			`${JSON.stringify(
				{
					kind: "repi-swarm-subagent-runtime-manifest-index",
					schemaVersion: 1,
					planId: swarm.parallelPlan?.planId ?? "missing",
					swarmArtifact: path,
					manifestCount: swarm.subagentRuntimeManifestCount,
					captured: swarm.subagentRuntimeManifestsCaptured,
					manifests: swarm.subagentRuntimeManifests,
				},
				null,
				2,
			)}\n`,
			0o644,
		);
	}
	atomicWriteFileSync(
		path,
		[
			"# REPI Swarm Artifact",
			"",
			formatSwarm(swarm as any, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(withSwarmArtifactReverseNext(swarm), null, 2),
			"```",
			"",
		].join("\n"),
		0o644,
	);
}
