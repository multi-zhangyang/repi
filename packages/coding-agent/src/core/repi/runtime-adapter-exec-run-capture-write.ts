/** Runtime adapter execution artifact write. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { updateMissionCheckpoint } from "./mission.ts";
import {
	inspectRuntimeAdapterTarget,
	parseRuntimeAdapterSignals,
	type RuntimeAdapterExecutionArtifactV1,
	summarizeRuntimeAdapterSignals,
} from "./runtime-adapter.ts";
import { atomicWriteFileSync } from "./runtime-adapter-exec-deps.ts";
import { evidenceToolchainDir } from "./storage.ts";
import { sha256Text, truncateMiddle } from "./text.ts";

export function writeRuntimeAdapterExecutionArtifact(params: {
	adapter: any;
	selectedRunner: "native" | "fallback";
	command: string;
	target: string;
	startedAt: string;
	finishedAt: string;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
}): { artifact: RuntimeAdapterExecutionArtifactV1; path: string } {
	const { adapter, selectedRunner, command, target, startedAt, finishedAt, result } = params;
	const combined = `${result.stdout}\n${result.stderr}`;
	const parserSignals = parseRuntimeAdapterSignals(adapter, combined);
	const artifact: RuntimeAdapterExecutionArtifactV1 = {
		kind: "RuntimeAdapterExecutionArtifactV1",
		schemaVersion: 1,
		adapterId: adapter.adapterId,
		domainId: adapter.domainId,
		bridgeId: adapter.bridgeId,
		target,
		targetProfile: inspectRuntimeAdapterTarget(target),
		startedAt,
		finishedAt,
		selectedRunner,
		command,
		exitCode: result.code,
		killed: Boolean(result.killed),
		stdoutSha256: sha256Text(result.stdout),
		stderrSha256: sha256Text(result.stderr),
		parserSignals,
		parserSignalSummary: summarizeRuntimeAdapterSignals(adapter, parserSignals),
		artifactKinds: adapter.artifactKinds,
		ingestTargets: adapter.ingestTargets,
		proofExitSignals: adapter.proofExitSignals,
	};
	const dir = join(evidenceToolchainDir(), "runtime-adapters", adapter.adapterId);
	mkdirSync(dir, { recursive: true });
	const path = join(dir, `${startedAt.replace(/[:.]/g, "-")}.json`);
	atomicWriteFileSync(
		path,
		`${JSON.stringify(
			{
				...artifact,
				stdoutHead: truncateMiddle(result.stdout, 8000),
				stderrHead: truncateMiddle(result.stderr, 4000),
			},
			null,
			2,
		)}\n`,
		0o644,
	);
	// Soft-mark reverse proof as pending after a successful runtime capture so thrash stops
	// can engage before re_domain_proof_exit closes the gate as done.
	try {
		const head = `${result.stdout}\n${result.stderr}`;
		const proofOk =
			result.code === 0 &&
			/proof\.exit=(partial_runtime_capture|runtime_capture_strong)/i.test(head) &&
			/bind_ready=true/i.test(head);
		if (proofOk) {
			updateMissionCheckpoint("reverse_proof_exit_ready", "pending", `runtime_adapter ${adapter.adapterId} ${path}`);
			updateMissionCheckpoint("minimal_path_proven", "pending", `runtime_adapter ${adapter.adapterId} ${path}`);
		}
	} catch {
		/* optional */
	}
	return { artifact, path };
}
