import { spawnSync } from "node:child_process";
/** Swarm worker child-session probe with reverse capture signal. */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import { uniqueNonEmpty } from "../../text.ts";
import { swarmExecutionDigest } from "../pure.ts";

type WorkerChildSessionRuntimeBatchV1 = any;
type WorkerChildProcessProbeV1 = any;

export function runWorkerChildProcessProbe(
	batch: WorkerChildSessionRuntimeBatchV1,
	artifactPath: string,
): WorkerChildProcessProbeV1 {
	const probeId = `child-process-probe:${createHash("sha256").update(`${batch.batchId}:${artifactPath}`).digest("hex").slice(0, 16)}`;
	const probeDir = artifactPath.replace(/\.json$/i, "-child-process");
	const home = join(probeDir, "home");
	const isolatedHome = join(home, ".repi", "agent");
	mkdirSync(isolatedHome, { recursive: true });
	const stdoutPath = join(probeDir, "stdout.txt");
	const stderrPath = join(probeDir, "stderr.txt");
	const command =
		process.env.REPI_CHILD_PROCESS_REPI_BIN ??
		(existsSync(join(process.env.REPI_REPO_ROOT ?? process.cwd(), "repi"))
			? join(process.env.REPI_REPO_ROOT ?? process.cwd(), "repi")
			: "repi");
	const args = ["--offline", "--help"];
	const cwd = existsSync(process.env.REPI_REPO_ROOT ?? "") ? (process.env.REPI_REPO_ROOT as string) : process.cwd();
	const envAllowlist = uniqueNonEmpty(
		[...batch.launchPolicy.envAllowlist, "REPI_CODING_AGENT_DIR", "REPI_REPO_ROOT"],
		64,
	);
	const envDenylist = batch.launchPolicy.envDenylist;
	const env: NodeJS.ProcessEnv = {
		PATH: process.env.PATH ?? "",
		HOME: home,
		REPI_PRODUCT: "1",
		REPI_PRIMARY: "1",
		REPI_OFFLINE: "1",
		REPI_SKIP_VERSION_CHECK: "1",
		REPI_SKIP_PACKAGE_UPDATE_CHECK: "1",
		REPI_TELEMETRY: "0",
		REPI_CODING_AGENT_DIR: isolatedHome,
		REPI_CODING_AGENT_CONFIG_DIR: ".repi",
		REPI_CODING_AGENT_APP_NAME: "repi",
		PI_OFFLINE: "1",
		PI_SKIP_VERSION_CHECK: "1",
		PI_SKIP_PACKAGE_UPDATE_CHECK: "1",
		PI_TELEMETRY: "0",
	};
	if (process.env.REPI_REPO_ROOT) env.REPI_REPO_ROOT = process.env.REPI_REPO_ROOT;
	const started = Date.now();
	const startedAt = new Date(started).toISOString();
	const result = spawnSync(command, args, {
		cwd,
		env,
		encoding: "utf8",
		timeout: Math.min(30000, Math.max(5000, batch.launchPolicy.timeoutMs)),
		maxBuffer: 8 * 1024 * 1024,
	});
	const ended = Date.now();
	const stdout = result.stdout ?? "";
	const stderr = result.stderr ?? "";
	// Atomic (opt #208): temp+rename 0o644 — see the swarm stdout/stderr note
	// above; a torn writeFileSync would leave a truncated worker-output artifact.
	atomicWriteFileSync(stdoutPath, stdout, 0o644);
	atomicWriteFileSync(stderrPath, stderr, 0o644);
	const combined = `${stdout}\n${stderr}`;
	const assertions = {
		repiCommandExecuted: /repi\b/i.test(combined) && /REPI|reverse\/pentest|independent product/i.test(combined),
		reverseCaptureSignal:
			/proof\.exit|bind_ready|re_native_runtime|re_domain_proof_exit|re_mobile_runtime|re_live_browser|frida|objdump|checksec|partial_runtime_capture|runtime_capture_strong/i.test(
				combined,
			),
		isolatedRepiHome: isolatedHome.includes(".repi") && !isolatedHome.includes("/.pi/"),
		noPiHomeImport: !/(^|[\\s"'])~?\\\/?\\.pi\\\//i.test(combined),
		updateChecksDisabled: !/Update Available|pi\\.dev\/changelog|Run pi update/i.test(combined),
		telemetryDisabled: env.REPI_TELEMETRY === "0",
		noLiteralSecrets: !/(sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_[A-Za-z0-9])/i.test(combined),
		stdoutCaptured: stdout.length > 0 || stderr.length > 0,
	};
	const errors = Object.entries(assertions)
		.filter(([, value]) => !value)
		.map(([key]) => `assertion_failed:${key}`);
	if (result.error) errors.push(`spawn_error:${result.error.message}`);
	if ((result.status ?? 1) !== 0) errors.push(`exit_code:${result.status}`);
	return {
		kind: "WorkerChildProcessProbeV1",
		schemaVersion: 1,
		probeId,
		command,
		args,
		cwd,
		isolatedHome,
		startedAt,
		endedAt: new Date(ended).toISOString(),
		elapsedMs: Math.max(0, ended - started),
		exitCode: result.status,
		signal: result.signal,
		status: errors.length ? "blocked" : "pass",
		stdoutPath,
		stderrPath,
		stdoutSha256: swarmExecutionDigest(stdout),
		stderrSha256: swarmExecutionDigest(stderr),
		envAllowlist,
		envDenylist,
		assertions,
		errors: uniqueNonEmpty(errors, 32),
	};
}
