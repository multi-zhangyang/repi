/** Swarm-exec pure: command/timeout/spec helpers. */
import { createHash } from "node:crypto";

type SwarmWorkerRuntime = any;
export function sanitizeSwarmCommand(command: string): string {
	return command.trim().replace(/\s+#.*$/g, "");
}
export function swarmExecutionDigest(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}
export function stripSwarmPidMarker(stderr: string): {
	stderr: string;
	pid: number | null;
	parentPid: number | null;
} {
	const m = /__repi_swarm_pid=(\d+)\s+ppid=(\d+)/.exec(stderr);
	if (!m) return { stderr, pid: null, parentPid: null };
	const cleaned = stderr.replace(m[0], "").replace(/^\n+/, "");
	return {
		stderr: cleaned,
		pid: Number(m[1]) || null,
		parentPid: Number(m[2]) || null,
	};
}
export function swarmWorkerSpec(workerName: string): "explorer" | "reverser" | "operator" | "verifier" {
	if (/native|pwn|firmware|mobile|malware|reverse|dfir|pcap|crypto/i.test(workerName)) return "reverser";
	if (/verif|challenge|audit|report/i.test(workerName)) return "verifier";
	if (/web-authz|cloud|identity|agentsec|map|surface|explore|recon/i.test(workerName)) return "explorer";
	return "operator";
}
export function envBoundedInteger(name: string, fallback: number, min: number, max: number): number {
	const parsed = Number.parseInt(process.env[name] ?? "", 10);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(min, Math.min(max, parsed));
}
export function swarmWorkerTimeoutMs(worker: SwarmWorkerRuntime, execution: "simulated" | "real"): number {
	const global = envBoundedInteger(
		execution === "real" ? "REPI_SWARM_SUBAGENT_TIMEOUT_MS" : "REPI_SWARM_WORKER_TIMEOUT_MS",
		0,
		0,
		30 * 60 * 1000,
	);
	if (global > 0) return global;
	if (execution !== "real") return 60000;
	const spec = swarmWorkerSpec(worker.worker);
	if (spec === "reverser") return 360000;
	if (spec === "explorer") return 180000;
	return 240000;
}
export function swarmWorkerRetryLimit(execution: "simulated" | "real"): number {
	return envBoundedInteger(
		execution === "real" ? "REPI_SWARM_REAL_RETRY_LIMIT" : "REPI_SWARM_RETRY_LIMIT",
		execution === "real" ? 0 : 1,
		0,
		3,
	);
}
