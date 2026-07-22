/** Refresh swarm subagent runtime manifest capture + reverse gates. */

import { existsSync } from "node:fs";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";

type SwarmArtifact = any;

export function refreshSwarmSubagentRuntimeManifestCapture(swarm: SwarmArtifact): SwarmArtifact {
	const manifests = swarm.subagentRuntimeManifests ?? [];
	const subagentRuntimeManifestCount = manifests.length;
	const expectedWorkers = swarm.workers.length;
	const subagentRuntimeManifestsCaptured =
		expectedWorkers > 0 &&
		subagentRuntimeManifestCount >= expectedWorkers &&
		manifests.every(
			(manifest: any) =>
				manifest.kind === "SubagentRuntimeManifestV1" &&
				manifest.schemaVersion === 1 &&
				Boolean(manifest.runtimeManifestFile && existsSync(manifest.runtimeManifestFile)) &&
				Boolean(manifest.sessionDir && existsSync(manifest.sessionDir)) &&
				Boolean(manifest.stdoutPath && existsSync(manifest.stdoutPath)) &&
				Boolean(manifest.stderrPath && existsSync(manifest.stderrPath)) &&
				Boolean(manifest.stdoutSha256 && manifest.stderrSha256 && manifest.toolCallDigest) &&
				Number.isInteger(manifest.pid) &&
				Number.isInteger(manifest.parentPid) &&
				Boolean(manifest.model?.provider && manifest.model?.modelId),
		);
	const reverseHeavy = /native|pwn|malware|firmware|reverse|binary|exploit|mobile|web.authz|web-authz/i.test(
		JSON.stringify({ workers: swarm.workers ?? [], plan: swarm.plan ?? swarm.parallelPlan ?? "" }),
	);
	const captureBlob = manifests
		.map(
			(manifest: any) =>
				`${manifest.stdoutPath ?? ""} ${manifest.stderrPath ?? ""} ${manifest.runtimeManifestFile ?? ""}`,
		)
		.join("\n");
	const reverseCaptureReady =
		!reverseHeavy ||
		(/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(captureBlob) &&
			/bind_ready\s*=\s*true/i.test(captureBlob));
	return {
		...swarm,
		subagentRuntimeManifests: manifests,
		subagentRuntimeManifestCount,
		subagentRuntimeManifestsCaptured,
		reverseCaptureReady,
		reverseReleaseBlock:
			reverseHeavy && !reverseCaptureReady ? "blocked_until_runtime_capture_and_bind_ready" : undefined,
		reverseNextCommands: reverseHeavy
			? reverseDomainCaptureNextCommands({
					routeOrBlob: JSON.stringify({
						workers: swarm.workers ?? [],
						plan: swarm.plan ?? swarm.parallelPlan ?? "",
					}),
					includeGates: true,
				}).slice(0, 4)
			: [],
		sourceArtifacts: Array.from(
			new Set(
				[
					...swarm.sourceArtifacts,
					swarm.subagentRuntimeManifestPath,
					...manifests.flatMap((manifest: any) => [
						manifest.runtimeManifestFile,
						manifest.stdoutPath,
						manifest.stderrPath,
					]),
				].filter((item): item is string => Boolean(item)),
			),
		).slice(0, 64),
	};
}
